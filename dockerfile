FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build  # Only if using Next.js
CMD ["npm", "run", "prod"]