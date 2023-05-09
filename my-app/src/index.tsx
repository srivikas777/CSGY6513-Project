import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './App';

const handleSubmit = (datasetId: string, query: string) => {
  // Do something with the datasetId and query
  console.log(`Dataset ID: ${datasetId}`);
  console.log(`Query: ${query}`);

  try {
    const data = {
      datasetId: datasetId,
      query: query
    };
    const jsonString = JSON.stringify(data);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    //const file = new File([jsonString], "data.json", { type: "application/json" });
    //link.href = URL.createObjectURL(file);
    //link.download = 'data.json';
    //document.body.appendChild(link);
    //link.click();
    //document.body.removeChild(link);
  } catch (error) {
    console.error(error);
    console.log("File not generated!");
  }
};


ReactDOM.render(
  <React.StrictMode>
    <App onSubmit={handleSubmit} />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
//reportWebVitals();
