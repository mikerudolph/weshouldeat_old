We Should Eat App
======================

This is a prototype application built using the following:

	- node.js
	- socket.io
	- redis
	- express
	- oauth
	- backbone.js

Details about the project
	
This is a real time web app where users can either create a new session or join one thats already in progress, joining you with your friends / co-workers you are presented with options to suggest a place to eat lunch, or vote on a already suggested place your peer has setup.

Currently, redis is being used to store users data, as well as all voting information, and dynamic socket.io sessions(rooms).

Redis is also being used with is pub/sub model functionality for providing real-time updates to actions others in the session complete such as joining the session, submitting a place to eat, and voting.

------------------------------------------------------------------------------
Currently known bugs

- Map does not always update when new winning suggestion is recieved
- When there is no suggested places yet, not all browsers are picking up HTML5 navigator to set map to users current location
- After site is cached click the "Suggest a place" button results in .modal() not a function err.

------------------------------------------------------------------------------
TODOS:

- Setup redis for session storage
- .modal() not a fucntion err is most likly result in require.js setup, redo front end script implimentation