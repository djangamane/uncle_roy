# UNC Planetary Chess Assistant

A chat interface for the UNC Planetary Chess Assistant powered by OpenAI's API.

## Local Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.sample` and add your OpenAI API key
4. Start the development server:
   ```
   npm run dev
   ```
5. Open http://localhost:8080 in your browser

## Deployment on Render

This application is configured for easy deployment on Render.

### Automatic Deployment

1. Push your code to a GitHub repository
2. Log in to [Render](https://render.com)
3. Create a new Web Service and connect your GitHub repository
4. Render will automatically detect the `render.yaml` configuration
5. Add your `OPENAI_API_KEY` as an environment variable in the Render dashboard
6. Deploy the application

### Manual Deployment

1. Log in to [Render](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure the following settings:
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add the following environment variables:
   - `NODE_ENV`: production
   - `OPENAI_API_KEY`: your OpenAI API key
6. Deploy the application

## Environment Variables

- `PORT`: The port on which the server will run (default: 8080)
- `OPENAI_API_KEY`: Your OpenAI API key (required)

## Features

- Chat interface for interacting with the UNC Planetary Chess Assistant
- Responsive design for desktop and mobile devices
- Powered by OpenAI's API

## License

This project is proprietary and confidential.
