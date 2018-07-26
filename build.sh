# build backend
echo "building backend..."
cd backend
yarn run build
cd ..

# build frontend
echo "building frontend..."
cd frontend
yarn run build
cd ..

# build docker images
echo "building images..."
docker-compose build

# push docker image
echo "pushing docker images..."
docker image push cinnapple/mini-validator-list-backend
docker image push cinnapple/mini-validator-list-frontend
