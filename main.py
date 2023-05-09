""""
# WorkFlow:
# 1> Getting the data from the API into the CSV Format
# 2> Converting the CSV to Parquet
# 3> Uploading the Parquet file to the S3 Object Store
# 4> Querying the Parquet file using DuckDB

datamart.socrata.data-cityofchicago-org.k7hf-8y75
SELECT * FROM my_parquet_table LIMIT 2
"""

import os
import io
import duckdb
from minio import Minio
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import requests

app = Flask(__name__)
CORS(app)

minio_client = Minio(
    "localhost:9003",
    access_key="kaushik",
    secret_key="Suneetha2019",
    secure=False
)

def upload_parquet_to_minio(parquet_path):
    """
    Uploads a Parquet file to MinIO object storage.
    """
    
    with open(parquet_path, 'rb') as file_data:
        #print(len(file_data.read()))
        #print(object_name)
        #file_content = file_data.read()
        object_name = parquet_path.split("/")[-1]
        file_stat = os.stat(parquet_path)
        minio_client.put_object(
            "discovery-bucket",
            object_name,
            file_data,
            #io.BytesIO(file_content),
            length=file_stat.st_size,
            content_type='application/octet-stream'
        )
    print(f"File '{object_name}' uploaded successfully to MinIO!")
    #print(f"File '{object_name}' uploaded successfully to MinIO with {len(file_data.read())} bytes!")




def get_parquet_file_from_minio(parquet_file_path):
    """
    Downloads a Parquet file from MinIO object storage and returns the in-memory file object.
    """
    
    parquet_file = io.BytesIO()
    minio_client.get_object(
        "discovery-bucket",
        parquet_file_path,
        parquet_file
    )
    #parquet_file.seek(0)  # Move the file pointer to the beginning of the file
    #return parquet_file
    # write the file to a local file
    with open("temp.parquet", "wb") as f:
        f.write(parquet_file.getbuffer())

    # read the local file into a PyArrow table
    table = pq.read_table("temp.parquet")
    return table

def download_dataset(dataset_id, format='csv'):
    url = f'https://auctus.vida-nyu.org/api/v1/download/{dataset_id}?format={format}'
    response = requests.get(url)
    if response.ok:
        return response.content
    else:
        raise Exception(f'Failed to download dataset {dataset_id}. Response status code: {response.status_code}')

def convert_csv_to_parquet(csv_path, parquet_path):
    # read CSV file into pandas dataframe
    df = pd.read_csv(csv_path)
    # create a pyarrow table from the dataframe
    table = pa.Table.from_pandas(df)
    # print(table.column_names)  # print the column names of the table to check if it has been created successfully

    # create the directory if it doesn't exist
    os.makedirs(os.path.dirname(parquet_path), exist_ok=True)

    # write the table to a Parquet file
    print(f"Writing Parquet file to {parquet_path}")
    pq.write_table(table, parquet_path)
    print(f"Parquet file written to {parquet_path}")


@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    #dataset_id = 'datamart.socrata.data-cityofchicago-org.k7hf-8y75'
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        # download the dataset and write to local file
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]
        with open(f'data/{name_file}.csv', 'wb') as f:
            f.write(dataset_content)

        # convert CSV to Parquet and upload to MinIO
        parquet_path = f'data/{name_file}.parquet'
        convert_csv_to_parquet(f'data/{name_file}.csv', parquet_path)
        upload_parquet_to_minio(parquet_path)

        # read the Parquet file from MinIO and create a pyarrow table
        # parquet_file_path = f'{name_file}.parquet'
        # parquet_file_table = get_parquet_file_from_minio(parquet_file_path)
        # result=parquet_file_table.execute(query).fetchall()
        # print(result)
        
        #print(parquet_file)
        #table = pq.read_table(parquet_file)
        #print(table)
        # # Working from this:
        # execute SQL query on Parquet file
        conn = duckdb.connect(database=':memory:')
        cursor = conn.cursor()
        cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('{parquet_path}', compression='uncompressed')")
        result = cursor.execute(query).fetchall()
        print(result)
        
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)

"""

@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        # download the dataset and write to local file
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]
        with open(f'data/{name_file}.csv', 'wb') as f:
            f.write(dataset_content)

        # convert CSV to Parquet and upload to MinIO
        parquet_path = f'{name_file}.parquet'
        convert_csv_to_parquet(f'data/{name_file}.csv', parquet_path)
        upload_parquet_to_minio(parquet_path)

        print(parquet_path)
        # execute SQL query on Parquet file
        conn = duckdb.connect(database=':memory:')
        cursor = conn.cursor()
        parquet_file = get_parquet_file_from_minio(parquet_path)
        cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('{parquet_file}', compression='uncompressed')")
        result = cursor.execute(query).fetchall()
        print(result)

        return jsonify({'success': True, 'result': result})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})
"""

"""
import os
import io
import duckdb
from minio import Minio
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import requests

app = Flask(__name__)
CORS(app)

minio_client = Minio(
    "localhost:9003",
    access_key="kaushik",
    secret_key="Suneetha2019",
    secure=False
)


@app.route('/api/query', methods=['POST'])
def handle_query():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        # download the dataset and write to local file
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]
        with open(f'data/{name_file}.csv', 'wb') as f:
            f.write(dataset_content)

        # convert CSV to Parquet and upload to MinIO
        parquet_path = f'data/{name_file}.parquet'
        convert_csv_to_parquet(f'data/{name_file}.csv', parquet_path)
        upload_parquet_to_minio(parquet_path)

        # execute SQL query on Parquet file
        conn = duckdb.connect(database=':memory:')
        cursor = conn.cursor()
        cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('{name_file}.parquet', compression='uncompressed')")
        result = cursor.execute(query).fetchall()
    
        print(result)

        return jsonify({'success': True, 'result': result})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})

def download_dataset(dataset_id, format='csv'):
    url = f'https://auctus.vida-nyu.org/api/v1/download/{dataset_id}?format={format}'
    response = requests.get(url)
    if response.ok:
        return response.content
    else:
        raise Exception(f'Failed to download dataset {dataset_id}. Response status code: {response.status_code}')

def convert_csv_to_parquet(csv_path, parquet_path):
    # read CSV file into pandas dataframe
    df = pd.read_csv(csv_path)
    # create a pyarrow table from the dataframe
    table = pa.Table.from_pandas(df)

    # create the directory if it doesn't exist
    os.makedirs(os.path.dirname(parquet_path), exist_ok=True)

    # write the table to a Parquet file
    pq.write_table(table, parquet_path)

def upload_parquet_to_minio(parquet_path):
    # open the local file in binary mode
    with open(parquet_path, 'rb') as file_data:
        # get the file size and upload the file to the object store
        file_stat = os.stat(parquet_path)
        minio_client.put_object(
            "discovery-bucket",
            os.path.basename(parquet_path),
            file_data,
            length=file_stat.st_size,
            content_type='application/octet-stream'
        )
    print(f"File '{os.path.basename(parquet_path)}' uploaded successfully to MinIO!")
if __name__ == '__main__':
    app.run(debug=True)

"""
