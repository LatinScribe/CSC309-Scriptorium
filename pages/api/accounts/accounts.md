# Account API Backend

Features:
1) [Sign Up](#register)
2) [Sign In](#login)
<!-- 3) [Exists by Name](#exists-by-name) -->
4) [Save Profile](#save-a-profile)
5) [Update Profile](#update-a-profile)
6) [Retrieve Profile](#retrieve-a-profile)

Planned Features:

4) Password Reset
   
5) Token Reset

---

### register

The API to sign up a user for this system (with the given username and password).

Note:
1. Username can be any string (currently no rules), if not taken by someone else already.
2. It might be helpful to copy and paste or save the returned token immediately (you will likely need this again later on).
The token will also be shown on sign-in. It is recommended that the same be done with the returned id.

**URL** : `/api/accounts/register`

**Method** : `POST`

**Auth required** : Not required to signup

**Required Request Parameters**
```json
{
    "username": "The username chosen",
    "password": "The password chosen",
    "email": "The email chosen",
}
```
#### Success Responses:

**Condition** :  The username has not previously been used to signup for the system.

**Code** : `200 OK`

**Content example** :

```json
{
    "status_code": 201,
    "user" : {"created user object"},
}
```

#### Error Response:

##### Username not available.

**Condition** : Someone has signed up with this username already.

**Content example** :

```json
{
    "status_code": 400,
    "error": "USER ALREADY EXISTS"
}
```

##### No Username or Password Given

**Condition** : Either (or both) the username or password were not passed correctly in the request.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
   "status_code": 400,
   "error": "Please provide all the required fields"
}
```

##### Invalid role

**Condition** : role was not either USER or ADMIN.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
   "status_code": 400,
   "error": "Not user or admin"
}
```

---

### login

The API to sign in with a username and password to the system.

Note:
1.  It might be helpful to copy and paste or save the returned token immediately (you will likely need this again later on).

**URL** : `/api/accounts/login`

**Method** : `POST`

**Auth required** : Not required to signup

**Required Request Parameters**
```json
{
    "username": "The username chosen",
    "password": "The password chosen",
}
```
#### Success Responses

**Condition** :  The username and password matches the associated user data on the server.

**Code** : `200 OK`

**Content example** :

```json
{
    "status_code": 200,
    "accessToken": "Accesstoken",
    "refreshToken": "Refreshtoken",
}
```

#### Error Response

##### No Username or Password Given

**Condition** : Either (or both) the username or password were not passed correctly in the request.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
   "status_code": 400,
   "error": "Please provide all the required fields"
}
```

##### Given Username or Password is incorrect

**Condition** : Either (or both) the username or password were incorrect or incorrectly passed in the request.

**Code** : `401 BAD REQUEST`

**Content example** :

```json
{
   "status_code": 401,
   "error": "Invalid credentials"
}
```

---

<!-- ### Exists by Name

The API to check if a username is already in the system.

**URL** : `/existsByName`

**Method** : `GET`

**Auth required** : Not required

**Required Request Parameters**
```json
{
    "username": "The username to check"
}
```
#### Success Responses

**Condition** :  No errors were thrown in checking

**Code** : `200 OK`

**Content example** :

```json
{
    "status_code": 200,
    "message": "USER DOES NOT EXIST or USER EXISTS"
}
```

#### Error Response

##### No Username 

**Condition** : Username was not passed correctly in the request.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
   "status_code": 400,
   "message": "NO USERNAME GIVEN"
}
``` -->

---

### Save a profile

The API to save a profile to a given user.

Note:
1. This function should only be used to save the initial/first profile. If the user already
has a profile in the system associated to their account, the PUT method should be used instead

**URL** : `/api/accounts/users`

**Method** : `POST`

**Auth required** : Not required currently.

**Required Request Body**
```json
{
    "id": "The user's account id",
    "finAidReq": "The finantial aid required by the user",
    "prefProg": "The prefered program selected by user",
    "avgSalary": "The post-graduate desire salary selected by the user",
    "uniRankingRangeStart": "The beginning of the range of desired College ranking",
    "uniRankingRangeEnd": "The end of the range of desired College ranking",
    "locationPref": "The prefered location selected by the user"
}
```
#### Success Responses

**Condition** : Access to the account is verified by the authorization token, and a profile for the user has not been saved before.

**Code** : `200 OK`

**Content example** : 

```json
{
    "message": "Profile Saved Successfully",
    "status_code": 200
}
```

#### Error Response

##### Profile associated to this user already exists.

**Condition** : A profile for this user has already been created.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
    "message": "This user already has a profile in the system. If you want to moddify the profile, please use updateProfile instead",
    "status_code": 400
}
```

##### Incorrect or missing request body paraameters

**Condition** : Failed to correctly provide the required request body parameters

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
    "message": "id, token, finAidReq, prefProg, avgSalary, uniRankingRangeStart, uniRankingRangeEnd, locationPref are required",
    "status_code": 400
}
```

##### API Token is invalid

**Condition** : The given authorization token doesn't match with the ones that have the access to the utorid. Or the authorization token doesn't exist.
See the documentation for signUp for how to get a token.

**Code** : `401`

**Content example** :

```json
{
    "message": "Invalid token",
    "status_code": 401
}
```

##### Server Error

**Condition** : The backend server has an issue.

**Code** : `500 Internal Server Error`

**Content example** :

```json
{
   "status_code": 500,
   "message": "Error saving profile"
}, 500
```

---

### Update a profile

The API to update the profile of a given user.

Note:
1. This function should only be used after a profile has already been saved for the given user.
If the user does not have a profile yet, the saveProfile API should be used instead. 

**URL** : `/updateProfile`

**Method** : `PUT`

**Auth required** : Required in header `Authorization`.

**Required Request Body**
```json
{
    "id": "The user's account id",
    "finAidReq": "The finantial aid required by the user",
    "prefProg": "The prefered program selected by user",
    "avgSalary": "The post-graduate desire salary selected by the user",
    "uniRankingRangeStart": "The beginning of the range of desired College ranking",
    "uniRankingRangeEnd": "The end of the range of desired College ranking",
    "locationPref": "The prefered location selected by the user"
}
```
#### Success Responses

**Condition** : Access to the account is verified by the authorization token, and a profile for the given user exists.

**Code** : `200 OK`

**Content example** : 

```json
{
    "message": "Profile updated Successfully",
    "status_code": 200
}
```

#### Error Response

##### No Profile associated to this user.

**Condition** : A profile for this user has not yet been created.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
    "message": "This user does not have a profile in the system yet. Please save a profile first",
    "status_code": 400
}
```

##### Incorrect or missing request body paraameters

**Condition** : Failed to correctly provide the required request body parameters

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
    "message": "id, token, finAidReq, prefProg, avgSalary, uniRankingRangeStart, uniRankingRangeEnd, locationPref are required",
    "status_code": 400
}
```

##### API Token is invalid

**Condition** : The given authorization token doesn't match with the ones that have the access to the utorid. Or the authorization token doesn't exist.
See the documentation for signUp for how to get a token.

**Code** : `401`

**Content example** :

```json
{
    "message": "Invalid token",
    "status_code": 401
}
```

##### Server Error

**Condition** : The backend server has an issue.

**Code** : `500 Internal Server Error`

**Content example** :

```json
{
   "status_code": 500,
   "message": "Error updating profile"
}, 500
```

---

### Retrieve a profile

The API to retrieve the profile of a given user.

Note:
1. This function should only be used after a profile has already been saved for the given user.
If the user does not have a profile yet, the saveProfile API should be used instead. 

**URL** : `/profile`

**Method** : `GET`

**Auth required** : Required in header `Authorization`.

**Required Request Body**
```json
{
    "id": "The user's account id"
}
```
#### Success Responses

**Condition** : Access to the account is verified by the authorization token, and a profile exists for the given user.

**Code** : `200 OK`

**Content example** : 

```json
{
    "message": "Profile retrieved successfully",
    "finAidReq": "The finantial aid required by the user",
    "prefProg": "The prefered program selected by user",
    "avgSalary": "The post-graduate desire salary selected by the user",
    "uniRankingRangeStart": "The beginning of the range of desired College ranking",
    "uniRankingRangeEnd": "The end of the range of desired College ranking",
    "locationPref": "The prefered location selected by the user"
    "status_code": 200
}
```

#### Error Response

##### No Profile associated to this user.

**Condition** : A profile for this user has not yet been created.

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
    "message": "No Profile associated with this token",
    "status_code": 400
}
```

##### Incorrect or missing request body paraameters

**Condition** : Failed to correctly provide the id in the request body

**Code** : `400 BAD REQUEST`

**Content example** :

```json
{
    "message": "No id given",
    "status_code": 400
}
```

##### API Token is invalid

**Condition** : The given authorization token doesn't match with the ones that have the access to the utorid. Or the authorization token doesn't exist.
See the documentation for signUp for how to get a token.

**Code** : `401`

**Content example** :

```json
{
    "message": "Invalid token",
    "status_code": 401
}
```

##### Server Error

**Condition** : The backend server has an issue.

**Code** : `500 Internal Server Error`

**Content example** :

```json
{
   "status_code": 500,
   "message": "Error retrieving profile"
}, 500
```
---

### General Errors
##### Database Connection Error (general)
**Condition** : Error in connecting to database during http request.

**Code** : `400`

**Content example** :

```json
{
   "status_code": 400,
   "message": "Error Connecting to Database. Request has timedout. Please contact Support"
}
```

##### Database Connection Error (middleware)
**Condition** : Error in connecting to the database in the middleware processing.

**Code** : `401`

**Content example** :

```json
{
   "status_code": 401,
   "message": "Error Connecting to Database"
}
```
