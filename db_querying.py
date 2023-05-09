import duckdb
import io
from minio import Minio

minio_client = Minio(
    "localhost:9003",
    access_key="kaushik",
    secret_key="Suneetha2019",
    secure=False
)

# specify the path to the Parquet file on the S3 object store
parquet_file_path = "k7hf-8y75.parquet"

# create an in-memory file object to read the Parquet file
parquet_file = io.BytesIO()
minio_client.get_object(
    "discovery-bucket",
    parquet_file_path,
    parquet_file
)

# create a DuckDB connection to the in-memory file object

# create a DuckDB connection to the in-memory file object
conn = duckdb.connect(database=':memory:')
cursor = conn.cursor()
#cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('{parquet_file.getvalue().hex()}', 'compression=uncompressed')")
cursor.execute(f"CREATE TABLE my_parquet_table AS SELECT * FROM parquet_scan('{parquet_file_path}', compression='uncompressed')")
result = cursor.execute("SELECT COUNT(*) FROM my_parquet_table").fetchall()
print(result)



"""
import duckdb
import io
from minio import Minio

minio_client = Minio(
    "localhost:9003",
    access_key="kaushik",
    secret_key="Suneetha2019",
    secure=False
)

# specify the path to the Parquet file on the S3 object store
parquet_file_path = "k7hf-8y75.parquet"

# create an in-memory file object to read the Parquet file
parquet_file = io.BytesIO()
minio_client.get_object(
    "discovery-bucket",
    parquet_file_path,
    parquet_file
)
# /Users/kaushiktummalapalli/Desktop/AUCTUS-2/data/discovery-bucket/k7hf-8y75.parquet/48e37bc8-ee2a-463c-9098-7a8d62a2ba45

# create a DuckDB connection to the in-memory file object
conn = duckdb.connect(database=':memory:')
conn.register_parquet_file("my_parquet_table", parquet_file)

# execute SQL queries on the Parquet file
result = conn.execute("SELECT COUNT(*) FROM my_parquet_table")
print(result.fetchall())

# discovery-bucket/k7hf-8y75.parquet
"""
