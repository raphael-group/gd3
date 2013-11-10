#!/usr/bin/python
import sys
import os
if 'HOTNET' not in os.environ:
    raise Error('Could not find HotNet2 installation. Please add HOTNET environment variable.')
sys.path.insert(0, os.environ['HOTNET'])

import argparse
import json
import hnio
from collections import defaultdict, namedtuple
from constants import *

def parse_args(raw_args):
    description = 'Draws oncoprints for the given subnetworks and mutation data.'
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('-s', '--subnetworks_file', required=True,
                        help='Path to tab-separated file listing components for which oncoprints\
                              should be generated, one component per line.')
    parser.add_argument('-v', '--snv_file',
                        help='Path to a tab-separated file containing SNVs where the first column\
                              of each line is a sample ID and subsequent columns contain the names\
                              of genes with SNVs in that sample. Lines starting with "#" will be\
                              ignored.')
    parser.add_argument('-c', '--cna_file',
                        help='Path to a tab-separated file containing CNAs where the first column\
                              of each line is a sample ID and subsequent columns contain gene\
                              names followed by "(A)" or "(D)" indicating an amplification or\
                              deletion in that gene for the sample. Lines starting with "#" will\
                              be ignored.')
    parser.add_argument('-i', '--inactivating_snvs_file',
                        help='Path to a tab-separated file listing inactivating mutations where\
                              the first column of each line is a gene name and the second column\
                              is a sample ID. Lines starting with "#" will be ignored.')
    parser.add_argument('-p', '--sample_file',
                        help='File listing samples. Any SNVs or CNAs in samples not listed in this\
                              file will be ignored. If not provided, the set of samples is assumed\
                              to be all samples that are provided in the SNV or CNA data.')
    parser.add_argument('-g', '--gene_file',
                        help='File listing tested genes. Any SNVs or CNAs in genes not listed in\
                              this file will be ignored. If not provided, the set of tested genes\
                              is assumed to be all genes that are provided in the SNV or CNA data.')
    parser.add_argument('-t', '--type_file',
                        help='Path to tab-separated file listing sample types where the first\
                              column of each line is a sample ID and the second column is a type.\
                              If not provided, all samples are assumed to be of the same default\
                              type.')
    parser.add_argument('-l', '--color_file',
    					help='Path to tab-separated file listing a sample type in the first column\
    					      and the color that should be used for that sample type in the second\
    					      column. If none provided, samples will be colored according to\
    					      exclusivity and co-occurrence.')
    parser.add_argument('-w', '--width', type=int, default=900,
                        help='Width in pixels for oncoprints.')
    parser.add_argument('-o', '--output_directory', required=True,
                        help='Output directory in which oncoprints should be generated.')
    args = parser.parse_args(raw_args)

    #validate arguments
    if not args.snv_file and not args.cna_file:
        raise ValueError('At least one of snv_file and cna_file must be provided.')

    return args

def valid_cna_filter_thresh(string):
        value = float(string)
        if value <= .5:
            raise argparse.ArgumentTypeError("cna_filter_threshold must be > .5")
        return value

def write_color_file(input_color_file, output_color_file):
	arrs = [line.split() for line in open(input_color_file)]
	colors = dict([(arr[0], arr[1]) for arr in arrs])
	json.dump(colors, open(output_color_file, 'w'), indent=4)

DEFAULT_TYPE = 'DEFAULT'

def get_data_for_cc(cc, snvs, cnas, inactivating_snvs, sample2type):
    cc = set(cc)
    data = dict()
    samples = set()
    
    # INACTIVE_SNVs replace SNVs, but all other combinations can coexist
    M = defaultdict(lambda: defaultdict(list))
    for mut in inactivating_snvs:
        if mut.gene in cc:
        	M[mut.gene][mut.sample] = [mut.mut_type]
        	samples.add(mut.sample)
    
    for mut in snvs + cnas:
        if mut.gene in cc and (mut.mut_type != SNV or INACTIVE_SNV not in M[mut.gene][mut.sample]):
            M[mut.gene][mut.sample].append(mut.mut_type)
            samples.add(mut.sample)
    data['M'] = M

    reduced_s2t = dict((s, sample2type[s] if sample2type else DEFAULT_TYPE) for s in samples)
    data['sample2ty'] = reduced_s2t
    
    return data

Subnetwork = namedtuple('Subnetwork', ['index', 'genes'])

def get_subnetworks(subnetwork_file):
    arrs = [line.split() for line in open(subnetwork_file)]
    return [Subnetwork(i, arrs[i]) for i in range(len(arrs))]

def run(args):
    # create output directory if doesn't exist; warn if it exists and is not empty
    if not os.path.exists(args.output_directory):
        os.makedirs(args.output_directory)
    if len(os.listdir(args.output_directory)) > 0:
        print("WARNING: Output directory is not empty. Any conflicting files will be overwritten. "
              "(Ctrl-c to cancel).")

    samples = hnio.load_samples(args.sample_file) if args.sample_file else None
    genes = hnio.load_genes(args.gene_file) if args.gene_file else None
    snvs = hnio.load_snvs(args.snv_file, genes, samples) if args.snv_file else []
    cnas = hnio.load_cnas(args.cna_file, genes, samples) if args.cna_file else []
    inactivating_snvs = hnio.load_inactivating_snvs(args.inactivating_snvs_file, genes, samples) \
                            if args.inactivating_snvs_file else []
    sample2type = hnio.load_sample_types(args.type_file) if args.type_file else None
    subnetworks = get_subnetworks(args.subnetworks_file)

    for subnetwork in subnetworks:
        print "Generating oncoprint for subnetwork %s" % subnetwork.index
        data = get_data_for_cc(subnetwork.genes, snvs, cnas, inactivating_snvs, sample2type)
        json.dump(data, open('%s/data.json' % args.output_directory, 'w'), indent=4)
        
        if args.color_file:
        	write_color_file(args.color_file, '%s/colors.json' % args.output_directory)
        	color_arg_string = '--sample_coloring=%s' % ('%s/colors.json' % args.output_directory)
        else:
        	color_arg_string = ''

        os.system('node drawOncoprint.js --json=%s/data.json --outdir=%s --width=%s %s' % 
            (args.output_directory, args.output_directory, args.width, color_arg_string))
        os.rename('%s/oncoprint.svg' % args.output_directory,
         		  '%s/oncoprint_%s.svg' % (args.output_directory, subnetwork.index))
        if args.color_file:
	        os.rename('%s/sampleTyLegend.svg' % args.output_directory,
	         		  '%s/sampleTyLegend%s.svg' % (args.output_directory, subnetwork.index))
    os.remove('%s/data.json' % args.output_directory)
    if args.color_file: os.remove('%s/colors.json' % args.output_directory)

if __name__ == "__main__":
    run(parse_args(sys.argv[1:]))
