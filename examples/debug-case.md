# QVAC Debug Detective Example

## Code

``javascript
const users = data.users;
console.log(users.map(user => user.name));
`` 

## Error

``text
TypeError: Cannot read properties of undefined (reading 'map')
`` 

## Developer Goal

Display the names of all users.

## Expected Investigation

The error indicates that data.users is undefined when map() is called. The developer should inspect the API response and verify that data.users exists and is an array before calling map().
