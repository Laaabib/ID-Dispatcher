# Hosting on your NAS (Docker)

This application is ready to be hosted on your own NAS (Synology, QNAP, TrueNAS, etc.) using Docker.

## Prerequisites

1.  **Docker**: Ensure Docker is installed and running on your NAS.
2.  **Firebase Config**: Make sure `firebase-applet-config.json` is in the root directory of the project.

## Deployment Steps

### 1. Export the Code
Go to the **Settings** menu in AI Studio and select **Export to ZIP** or **Export to GitHub**.

### 2. Build the Docker Image
Upload the files to your NAS, open a terminal (SSH), navigate to the project folder, and run:

```bash
docker build -t padma-id-manager .
```

### 3. Run the Container
Run the following command to start the app:

```bash
docker run -d \
  --name padma-id-manager \
  -p 3000:3000 \
  --restart always \
  padma-id-manager
```

The app will now be accessible at `http://[YOUR-NAS-IP]:3000`.

## Alternative: Manual Hosting (Node.js)

If you prefer not to use Docker, you can run it directly if your NAS has Node.js (v22+) installed:

1.  `npm install`
2.  `npm run build`
3.  `npm start`

## Important Notes

*   **Internet Access**: Your NAS must have internet access to connect to Firebase.
*   **Port Forwarding**: If you want to access the app from outside your home network, you will need to set up port forwarding on your router for port 3000.
*   **ZKTeco Integration**: If you are using the ZKTeco IP matching feature, ensure your NAS is on the same local network as your fingerprint devices.
