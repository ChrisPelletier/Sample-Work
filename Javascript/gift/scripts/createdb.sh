# S = server url
export S=http://admin:1234@127.0.0.1:5984

# delete existing databases if any
curl -X DELETE ${S}/users

# create database "users"
curl -X PUT    ${S}/users

# set admin as sole authorized user
curl -X PUT    ${S}/users/_security -H "Content-type: application/json" \
               -d @security.json

# create 2 users
curl -X POST   ${S}/users -H "Content-type: application/json"           \
               -d "{\"_id\": \"a\", \"pw\": \"a\", \"balance\": 3, \"gems\": 0, \"score\": 0 }"

curl -X POST   ${S}/users -H "Content-type: application/json"           \
               -d "{\"_id\": \"b\", \"pw\": \"b\", \"balance\": 0, \"gems\": 0, \"score\": 0 }"

