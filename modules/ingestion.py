"""
Data Ingestion Module
Handles uploading NGSIM data to Azure Blob Storage via batch ingestion.
"""

import os
import pandas as pd
from azure.storage.blob import BlobServiceClient, ContainerClient
import config


def connect_blob_storage() -> BlobServiceClient:
    """Establish connection to Azure Blob Storage."""
    if not config.AZURE_STORAGE_CONNECTION_STRING:
        raise ValueError("AZURE_STORAGE_CONNECTION_STRING not set in environment.")
    return BlobServiceClient.from_connection_string(config.AZURE_STORAGE_CONNECTION_STRING)


def ensure_container(blob_service: BlobServiceClient, container_name: str) -> ContainerClient:
    """Create the blob container if it doesn't exist."""
    container_client = blob_service.get_container_client(container_name)
    try:
        container_client.get_container_properties()
        print(f"  Container '{container_name}' already exists.")
    except Exception:
        container_client.create_container()
        print(f"  Container '{container_name}' created.")
    return container_client


def upload_raw_data(blob_service: BlobServiceClient, local_file_path: str) -> str:
    """
    Upload raw NGSIM CSV data to Azure Blob Storage (batch ingestion).
    Returns the blob name of the uploaded file.
    """
    container_client = ensure_container(blob_service, config.AZURE_CONTAINER_RAW)
    blob_name = os.path.basename(local_file_path)
    blob_client = container_client.get_blob_client(blob_name)

    file_size = os.path.getsize(local_file_path)
    print(f"  Uploading '{blob_name}' ({file_size / 1024:.1f} KB) to container '{config.AZURE_CONTAINER_RAW}'...")

    with open(local_file_path, "rb") as f:
        blob_client.upload_blob(f, overwrite=True)

    print(f"  Upload complete: {blob_name}")
    return blob_name


def download_raw_data(blob_service: BlobServiceClient, blob_name: str) -> pd.DataFrame:
    """
    Download raw NGSIM data from Azure Blob Storage and return as DataFrame.
    """
    container_client = blob_service.get_container_client(config.AZURE_CONTAINER_RAW)
    blob_client = container_client.get_blob_client(blob_name)

    print(f"  Downloading '{blob_name}' from Azure Blob Storage...")
    stream = blob_client.download_blob()
    data = stream.readall().decode("utf-8")

    from io import StringIO
    df = load_ngsim_data_from_string(data)
    print(f"  Downloaded {len(df)} records.")
    return df


def load_ngsim_local(file_path: str) -> pd.DataFrame:
    """
    Load NGSIM data from a local file (CSV or space-delimited text).
    Handles both the original 18-column format and the extended data.gov format.
    """
    print(f"  Loading local file: {file_path}")

    if file_path.endswith(".csv"):
        try:
            df = pd.read_csv(file_path)
            if len(df.columns) == 1:
                df = pd.read_csv(file_path, sep=r"\s+", header=None, names=config.NGSIM_COLUMNS)
        except Exception:
            df = pd.read_csv(file_path, sep=r"\s+", header=None, names=config.NGSIM_COLUMNS)
    else:
        df = pd.read_csv(file_path, sep=r"\s+", header=None, names=config.NGSIM_COLUMNS)

    # Handle the extended data.gov column format (has extra columns)
    df = _normalize_columns(df)

    # Filter to US-101 data if Location column exists
    if "Location" in df.columns:
        before = len(df)
        df = df[df["Location"].str.contains("us-101", case=False, na=False)].copy()
        print(f"  Filtered to US-101 records: {len(df)} (from {before})")
        df = df.drop(columns=["Location"], errors="ignore")

    # Drop duplicate rows
    before = len(df)
    df = df.drop_duplicates()
    if len(df) < before:
        print(f"  Removed {before - len(df)} duplicate rows.")

    if list(df.columns) != config.NGSIM_COLUMNS and len(df.columns) == len(config.NGSIM_COLUMNS):
        df.columns = config.NGSIM_COLUMNS

    print(f"  Loaded {len(df)} records, {df['Vehicle_ID'].nunique()} unique vehicles.")
    return df


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Map various NGSIM column naming conventions to our standard names."""
    column_map = {
        "v_length": "v_Length",
        "v_width": "v_Width",
        "v_class": "v_Class",
        "v_vel": "v_Vel",
        "v_acc": "v_Acc",
        "Space_Headway": "Space_Hdwy",
        "Time_Headway": "Time_Hdwy",
    }
    df = df.rename(columns=column_map)

    # Drop extra columns from the extended format that we don't need
    extra_cols = ["O_Zone", "D_Zone", "Int_ID", "Section_ID", "Direction", "Movement"]
    df = df.drop(columns=[c for c in extra_cols if c in df.columns], errors="ignore")

    return df


def load_ngsim_data_from_string(data_str: str) -> pd.DataFrame:
    """Parse NGSIM data from a string."""
    from io import StringIO
    try:
        df = pd.read_csv(StringIO(data_str))
        if len(df.columns) == 1:
            df = pd.read_csv(StringIO(data_str), sep=r"\s+", header=None, names=config.NGSIM_COLUMNS)
    except Exception:
        df = pd.read_csv(StringIO(data_str), sep=r"\s+", header=None, names=config.NGSIM_COLUMNS)

    # Normalize columns (same as local loading)
    df = _normalize_columns(df)

    # Filter to US-101 if Location column exists
    if "Location" in df.columns:
        df = df[df["Location"].str.contains("us-101", case=False, na=False)].copy()
        df = df.drop(columns=["Location"], errors="ignore")

    df = df.drop_duplicates()
    return df
