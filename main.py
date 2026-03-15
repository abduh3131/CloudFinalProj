"""
NGSIM Scenario Extraction System - Phase 1: Modular Monolithic Application

This is the main orchestrator that coordinates all modules in the processing pipeline:
  1. Data Ingestion  - Load/upload NGSIM data to Azure Blob Storage
  2. Data Storage    - Manage data in Azure Blob Storage
  3. Preprocessing   - Clean and prepare the data
  4. Scenario Detection - Identify car-following, stop-and-go, and lane change scenarios
  5. Output Generation  - Produce labeled 5-second scenario samples

Usage:
  python main.py                           # Process with local data
  python main.py --azure                   # Use Azure Blob Storage
  python main.py --data path/to/data.csv   # Specify data file
  python main.py --generate-sample         # Generate sample data for testing
"""

import sys
import os
import argparse
import time

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import config
from modules.ingestion import load_ngsim_local, connect_blob_storage, upload_raw_data, download_raw_data
from modules.preprocessing import preprocess
from modules.scenarios.car_following import detect_car_following
from modules.scenarios.stop_and_go import detect_stop_and_go
from modules.scenarios.lane_change import detect_lane_change
from modules.output import format_scenarios, print_summary, print_example_outputs
from modules.storage import save_output_local, save_output_csv, upload_scenarios_json
from modules.visualization import visualize_all


def parse_args():
    parser = argparse.ArgumentParser(description="NGSIM Scenario Extraction - Phase 1 Monolithic System")
    parser.add_argument("--data", type=str, default=config.NGSIM_DATA_PATH,
                        help="Path to NGSIM data file (CSV or TXT)")
    parser.add_argument("--azure", action="store_true",
                        help="Enable Azure Blob Storage integration")
    parser.add_argument("--generate-sample", action="store_true",
                        help="Generate sample NGSIM data for testing")
    parser.add_argument("--output-dir", type=str, default=config.OUTPUT_DIR,
                        help="Directory for output files")
    return parser.parse_args()


def generate_sample_data(output_path: str):
    """Generate realistic sample NGSIM data for testing."""
    from generate_sample import generate_sample_ngsim
    generate_sample_ngsim(output_path)


def main():
    args = parse_args()
    os.makedirs(args.output_dir, exist_ok=True)

    print("=" * 60)
    print("NGSIM SCENARIO EXTRACTION SYSTEM")
    print("Phase 1 - Modular Monolithic Application")
    print("Cloud Provider: Microsoft Azure")
    print("=" * 60)

    start_time = time.time()

    # Step 0: Generate sample data if requested
    if args.generate_sample:
        sample_path = os.path.join("data", "sample_ngsim.csv")
        os.makedirs("data", exist_ok=True)
        generate_sample_data(sample_path)
        args.data = sample_path

    # Step 1: Data Ingestion
    print("\n[STEP 1] DATA INGESTION")
    print("-" * 40)

    blob_service = None
    if args.azure:
        try:
            blob_service = connect_blob_storage()
            print("  Connected to Azure Blob Storage.")
            blob_name = upload_raw_data(blob_service, args.data)
            print("  Downloading data from Azure for processing...")
            df = download_raw_data(blob_service, blob_name)
        except Exception as e:
            print(f"  Azure connection failed: {e}")
            print("  Falling back to local file loading...")
            df = load_ngsim_local(args.data)
    else:
        print("  Running in local mode (use --azure for cloud integration).")
        df = load_ngsim_local(args.data)

    # Step 2: Preprocessing
    print("\n[STEP 2] DATA PREPROCESSING")
    print("-" * 40)
    df = preprocess(df)

    # Step 3: Scenario Detection
    print("\n[STEP 3] SCENARIO DETECTION")
    print("-" * 40)

    print("  Detecting car-following scenarios...")
    cf_scenarios = detect_car_following(df)
    print(f"  Found {len(cf_scenarios)} car-following scenarios.")

    print("  Detecting stop-and-go scenarios...")
    sg_scenarios = detect_stop_and_go(df)
    print(f"  Found {len(sg_scenarios)} stop-and-go scenarios.")

    print("  Detecting lane change scenarios...")
    lc_scenarios = detect_lane_change(df)
    print(f"  Found {len(lc_scenarios)} lane change scenarios.")

    # Step 4: Format and Output
    print("\n[STEP 4] OUTPUT GENERATION")
    print("-" * 40)
    all_scenarios = format_scenarios(cf_scenarios, sg_scenarios, lc_scenarios)

    # Save outputs
    json_path = os.path.join(args.output_dir, "scenarios_output.json")
    csv_path = os.path.join(args.output_dir, "scenarios_summary.csv")
    save_output_local(all_scenarios, json_path)
    save_output_csv(all_scenarios, csv_path)

    # Upload to Azure if enabled
    if blob_service:
        try:
            upload_scenarios_json(blob_service, all_scenarios, "scenarios_output.json")
        except Exception as e:
            print(f"  Azure upload failed: {e}")

    # Step 5: Visualization
    print("\n[STEP 5] VISUALIZATION")
    print("-" * 40)
    visualize_all(df, all_scenarios, args.output_dir)

    # Print summary and examples
    print_summary(all_scenarios)
    print_example_outputs(all_scenarios)

    elapsed = time.time() - start_time
    print(f"\nProcessing completed in {elapsed:.2f} seconds.")
    print(f"Results saved to: {os.path.abspath(args.output_dir)}/")


if __name__ == "__main__":
    main()
