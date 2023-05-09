import io
import duckdb
from minio import Minio
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import requests
from dask_sql import Context
import dask.dataframe as dd

app = Flask(__name__)
CORS(app)

minio_client = Minio(
    "localhost:9003",
    access_key="kaushik",
    secret_key="Suneetha2019",
    secure=False
)

def upload_csv_to_minio(csv_content, csv_path):
    """
    Uploads a CSV file to MinIO object storage.
    """
    object_name = csv_path.split("/")[-1]
    csv_file = io.BytesIO(csv_content)
    minio_client.put_object(
        "discovery-bucket",
        f'{csv_path}.csv',
        csv_file,
        csv_file.getbuffer().nbytes,
        content_type='application/octet-stream'
    )
    print(f"File '{object_name}' uploaded successfully to MinIO!")

def upload_parquet_to_minio(parquet_content, parquet_path):
    """
    Uploads a Parquet file to MinIO object storage.
    """
    object_name = parquet_path.split("/")[-1]
    parquet_file = io.BytesIO(parquet_content)
    """
    #corr
    minio_client.put_object(
        "discovery-bucket",
        f'{parquet_path}.parquet',
        parquet_file,
        parquet_file.getbuffer().nbytes,
        content_type='application/octet-stream'
    )
    """
    minio_client.put_object(
    "discovery-bucket",
    f'{parquet_path}',
    parquet_file,
    parquet_file.getbuffer().nbytes,
    content_type='application/octet-stream'
)

    print(f"File '{object_name}' uploaded successfully to MinIO!")

def download_dataset(dataset_id, format='csv'):
    url = f'https://auctus.vida-nyu.org/api/v1/download/{dataset_id}?format={format}'
    response = requests.get(url)
    if response.ok:
        return response.content
    else:
        raise Exception(f'Failed to download dataset {dataset_id}. Response status code: {response.status_code}')

def convert_csv_to_parquet(csv_content):
    # read CSV file into pandas dataframe
    df = pd.read_csv(io.BytesIO(csv_content))
    # create a pyarrow table from the dataframe
    table = pa.Table.from_pandas(df)
    # write the table to a Parquet file
    parquet_file = io.BytesIO()
    pq.write_table(table, parquet_file)
    return parquet_file.getvalue()
"""
@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        # download the dataset and write to MinIO
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]
        upload_csv_to_minio(dataset_content, name_file)

        # convert CSV to Parquet and upload to MinIO
        parquet_path = f'{name_file}.parquet'
        parquet_content = convert_csv_to_parquet(dataset_content)
        upload_parquet_to_minio(parquet_content, parquet_path)
        print(parquet_path)
        #print(parquet_content)
        # execute SQL query on Parquet file
        conn = duckdb.connect(database=':memory:')
        cursor = conn.cursor()
        print("1 here")
        cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('{parquet_path}', compression='uncompressed')")
        print("2 here")
        cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('minio://discovery-bucket/{parquet_path}', compression='uncompressed')")
        result = cursor.execute(query).fetchall()

        return jsonify({'success': True, 'result': result})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})
"""
@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        # download the dataset and write to MinIO
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]
        upload_csv_to_minio(dataset_content, name_file)

        # convert CSV to Parquet and upload to MinIO
        parquet_path = f'{name_file}.parquet'
        parquet_content = convert_csv_to_parquet(dataset_content)
        upload_parquet_to_minio(parquet_content, parquet_path)
        print(parquet_path)

        # Read the Parquet file from MinIO using Dask
        minio_url = f"s3://discovery-bucket/{parquet_path}"
        s3 = s3fs.S3FileSystem(
            key="kaushik",
            secret="Suneetha2019",
            client_kwargs={"endpoint_url": "http://localhost:9003"}
        )

        df = dd.read_parquet(minio_url, storage_options={'s3': s3}, engine="pyarrow")

        # Create a Dask SQL context and register the dataframe
        c = Context()
        c.register_dask_table(df, "my_parquet_table")

        # Execute the query
        result = c.sql(query).compute().to_dict(orient="records")

        return jsonify({'success': True, 'result': result})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})

   
if __name__ == '__main__':
    app.run(debug=True)