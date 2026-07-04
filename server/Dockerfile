FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install only production dependencies
RUN npm install --production

# Copy the rest of the backend source code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# Command to run the application
CMD [ "npm", "start" ]
