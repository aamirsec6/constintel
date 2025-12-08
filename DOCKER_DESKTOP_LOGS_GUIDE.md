# How to View Redis Logs in Docker Desktop

## Step-by-Step Guide

### Method 1: View Logs in Docker Desktop UI

1. **Open Docker Desktop**
   - Launch the Docker Desktop application on your Mac

2. **Go to Containers Tab**
   - Click on the "Containers" tab in the left sidebar (or at the top)
   - You should see a list of all running containers

3. **Find the Redis Container**
   - Look for the container named `constintel-redis`
   - It should show status "Running" with a green indicator

4. **Click on the Container**
   - Click on `constintel-redis` to open its details page

5. **View Logs**
   - Once the container details open, you'll see several tabs at the top
   - Click on the **"Logs"** tab
   - You'll see all the Redis logs displayed in real-time

6. **Filter or Search Logs** (Optional)
   - Use the search box at the top of the logs panel to filter specific log entries
   - You can also use the filter buttons if available

### Method 2: Enable Logs Auto-Refresh

1. **Follow steps 1-4 from Method 1**

2. **In the Logs tab**
   - Look for a toggle or button labeled "Auto-refresh" or a play/pause icon
   - Make sure it's enabled (usually enabled by default)
   - This will show new log entries as they appear

### Method 3: Export Logs

1. **Follow steps 1-5 from Method 1**

2. **Export Logs**
   - Look for a download or export button (usually at the top-right of the logs panel)
   - Click it to save logs to a file
   - Useful for debugging or sharing with team

## Additional Docker Desktop Features

### View Container Stats
- While viewing the container, click the **"Stats"** tab
- You'll see CPU, Memory, Network, and Disk I/O metrics
- Useful for monitoring Redis performance

### View Container Inspect
- Click the **"Inspect"** tab to see:
  - Environment variables
  - Network settings
  - Volume mounts
  - Configuration details

### Execute Commands
- Click the **"Exec"** tab (or look for a terminal icon)
- This opens an interactive terminal inside the container
- You can run commands like:
  ```
  redis-cli ping
  redis-cli MONITOR
  redis-cli INFO
  ```

## Quick Tips

- **Real-time Monitoring**: Keep the Logs tab open while your app runs to see Redis activity
- **Multiple Containers**: You can view logs for multiple containers simultaneously by opening them in separate windows
- **Log Levels**: Docker Desktop shows all log levels (INFO, WARNING, ERROR) with different colors if available

## Troubleshooting

**Can't see the container?**
- Make sure Docker Desktop is running
- Check if the container is stopped (might be in "Exited" state)
- Try refreshing the containers list

**Logs not updating?**
- Make sure the container is running
- Check the auto-refresh toggle is enabled
- Try clicking the refresh button manually

**Want more verbose logs?**
- You can restart the container with increased logging
- Or configure Redis with a custom config file for more detailed logs

