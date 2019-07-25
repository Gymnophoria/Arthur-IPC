# Arthur-IPC
The IPC (inter-process communication) module for Arthur. Runs an IPC server using node-ipc to allow communication between the [Arthur Bot](https://github.com/Gymnophoria/Arthur) and the [Arthur Website](https://github.com/Gymnophoria/Arthur-Website).

## Documentation
### Server Events
Events that the server receives from clients. Each event has a JSON object as data, with keys defined below.
#### hello
Allows server to cache socket and start any repetitive data polls (intervals) (e.g. sending cached stats to website)
 - `id`, string: The id of the client connecting, should be either `website` or `bot`.
 - `intervals`, array\<string>: Types of data to be sent on an interval. Sends all data associated with type, regardless of ID, so.. be careful.
 
#### data
Sent with data to be cached, likely sent on an interval.
 - `type`, **string**: The type of the data. One of the data types defined in a section below.
 - `data`, **object**: The data to be cached.
 - `time`, **number**: The time, in seconds, for the data to be kept in the cache. A value less than 0 means that the data should not be cached, and no value or 0 means that the data should be cached forever.

#### get
An event that requests data from the cache or the requested resource.
 - `from`, **string**: Where to get the data from; `bot` or `website`.
 - `type`, **string**: The data type. Types defined below.
 - `request`, **number**: The request number, provided by the client so it can differentiate `get` requests.
 - `id`, **string** *(optional)*: The ID for the type of data requested. May be necessary to get data (e.g. guild ID).
 - `fresh`, **boolean** *(optional)*: Whether or not to get fresh data; that is, data that is not cached by the server.
 
#### response
A response (to a `get` event, client-side) from a client with data.
 - `request`, **number**: The request number that the server provided with the get request.
 - `data`, **object**: The data requested.
 - `time`, **number**: Same as in `data`; time for data to be cached, in seconds.  
    **OR**
 - `request`, **number**: The request number that the server provided with the get request.
 - `error`, **string**|`true`: The error the client encountered while attempting to get the data.
