"""
import requests
response = requests.get(
    'https://auctus.vida-nyu.org/api/v1/download/datamart.socrata.data-cityofchicago-org.k7hf-8y75?format=csv',
)
response.raise_for_status()
print(response)
"""

import requests
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)


def download_dataset(dataset_id, format='csv'):
    url = f'https://auctus.vida-nyu.org/api/v1/download/{dataset_id}?format={format}'
    response = requests.get(url)
    if response.ok:
        return response.content
    else:
        raise Exception(f'Failed to download dataset {dataset_id}. Response status code: {response.status_code}')



@app.route('/api/download-dataset', methods=['POST'])
def handle_download_dataset():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]

        """
        with open(f'/../data/{name_file}.csv', 'wb') as f:
            f.write(dataset_content)

        convert_csv_to_parquet(f'data/{name_file}.csv', f'data/{name_file}.parquet')
        """
        with open(f'/Users/kaushiktummalapalli/Desktop/AUCTUS-2/data/{name_file}.csv', 'wb') as f:
            f.write(dataset_content)
        #print("Downloaded the dataset successfully")
        convert_csv_to_parquet(f'/Users/kaushiktummalapalli/Desktop/AUCTUS-2/data/{name_file}.csv', f'/Users/kaushiktummalapalli/Desktop/AUCTUS-2/data/{name_file}.parquet')
        #convert_csv_to_parquet(f'../data/{name_file}.csv', f'../data/{name_file}.parquet')

        return jsonify({'success': True})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})

def convert_csv_to_parquet(csv_path, parquet_path):
    # read CSV file into pandas dataframe
    df = pd.read_csv(csv_path)
    # create a pyarrow table from the dataframe
    table = pa.Table.from_pandas(df)

    # create the directory if it doesn't exist
    os.makedirs(os.path.dirname(parquet_path), exist_ok=True)

    # write the table to a Parquet file
    pq.write_table(table, parquet_path)

if __name__ == '__main__':
    app.run(debug=True)





"""
import requests
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
app = Flask(__name__)
CORS(app)


def download_dataset(dataset_id, format='csv'):
    url = f'https://auctus.vida-nyu.org/api/v1/download/{dataset_id}?format={format}'
    response = requests.get(url)
    if response.ok:
        return response.content
    else:
        raise Exception(f'Failed to download dataset {dataset_id}. Response status code: {response.status_code}')

@app.route('/api/download-dataset', methods=['POST'])
def handle_download_dataset():
    data = request.get_json()
    dataset_id = data.get('datasetId')
    query = data.get('query')
    print(dataset_id)
    print(query)
    try:
        dataset_content = download_dataset(dataset_id)
        pairs = dataset_id.split('.')
        name_file = pairs[-1]

        with open(f'data/{name_file}.csv', 'wb') as f:
            f.write(dataset_content)
        #print("Downloaded the dataset successfully")
        convert_csv_to_parquet(f'{name_file}.csv', f'{name_file}.parquet')

        return jsonify({'success': True})

    except Exception as e:
        print(e)
        return jsonify({'success': False, 'error': str(e)})

def convert_csv_to_parquet(csv_path, parquet_path):
    # read CSV file into pandas dataframe
    df = pd.read_csv(csv_path)
    #print(df.head())
    # create a pyarrow table from the dataframe
    table = pa.Table.from_pandas(df)

    # create the directory if it doesn't exist
    os.makedirs(os.path.dirname(parquet_path), exist_ok=True)

    # write the table to a Parquet file
    pq.write_table(table, f'data/{parquet_path}')

if __name__ == '__main__':
    app.run(debug=True)
"""
"""
# Dataset ID: 'datamart.socrata.data-cityofchicago-org.k7hf-8y75'

import requests
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
#import boto3

# Creating a Server to access the data from the Frontend(app.tsx) to the Backend:




def download_dataset(dataset_id, format='csv'):
    url = f'https://auctus.vida-nyu.org/api/v1/download/{dataset_id}?format={format}'
    response = requests.get(url)
    if response.ok:
        return response.content
    else:
        raise Exception(f'Failed to download dataset {dataset_id}. Response status code: {response.status_code}')

dataset_id = 'datamart.socrata.data-cityofchicago-org.k7hf-8y75' 
dataset_content = download_dataset(dataset_id)
pairs=dataset_id.split('.')
name_file=pairs[-1]

with open(f'{name_file}.csv', 'wb') as f:
    f.write(dataset_content)

def convert_csv_to_parquet(csv_path, parquet_path):
    # read CSV file into pandas dataframe
    df = pd.read_csv(csv_path)

    # create a pyarrow table from the dataframe
    table = pa.Table.from_pandas(df)

    # write the table to a Parquet file
    pq.write_table(table, parquet_path)

# To use this function, simply call it with the path of your CSV file and the desired output path for the Parquet file, like so:
convert_csv_to_parquet(f'{name_file}.csv', f'{name_file}.parquet')
"""