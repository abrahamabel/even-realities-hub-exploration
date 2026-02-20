import {
  waitForEvenAppBridge,
  type EvenAppBridge,
  type EvenHubEvent,
  type DeviceStatus,
  DeviceConnectType,
  OsEventTypeList,
  CreateStartUpPageContainer,
  ListContainerProperty,
  ListItemContainerProperty,
  TextContainerProperty,
  TextContainerUpgrade,
} from '@evenrealities/even_hub_sdk';

// Simple log helper — writes to both console and the page
const logEl = document.getElementById('log')!;
const statusEl = document.getElementById('status')!;

function log(msg: string) {
  console.log(msg);
  logEl.textContent += msg + '\n';
}

function setStatus(msg: string) {
  statusEl.textContent = msg;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  setStatus('Initializing bridge...');
  let bridge: EvenAppBridge;

  try {
    bridge = await waitForEvenAppBridge();
    setStatus('Bridge ready!');
    log('Bridge initialized successfully');
  } catch (err) {
    setStatus('Bridge init failed');
    log(`Error: ${err}`);
    return;
  }

  // ── Get user & device info ──────────────────────────────────────

  try {
    const user = await bridge.getUserInfo();
    log(`User: ${user.name} (uid: ${user.uid}, country: ${user.country})`);
  } catch (err) {
    log(`getUserInfo error: ${err}`);
  }

  try {
    const device = await bridge.getDeviceInfo();
    if (device) {
      log(`Device: model=${device.model}, sn=${device.sn}`);
      log(`  connected=${device.status.isConnected()}, battery=${device.status.batteryLevel}%`);
    } else {
      log('No device connected');
    }
  } catch (err) {
    log(`getDeviceInfo error: ${err}`);
  }

  // ── Create glasses UI ───────────────────────────────────────────

  // A simple 2-container page:
  //  - A list container (with event capture) showing 3 items
  //  - A text container showing a welcome message
  try {
    const result = await bridge.createStartUpPageContainer(
      new CreateStartUpPageContainer({
        containerTotalNum: 2,
        listObject: [
          new ListContainerProperty({
            xPosition: 20,
            yPosition: 20,
            width: 260,
            height: 248,
            borderWidth: 1,
            borderColor: 5,
            borderRdaius: 3,
            paddingLength: 4,
            containerID: 1,
            containerName: 'main-list',
            itemContainer: new ListItemContainerProperty({
              itemCount: 3,
              itemWidth: 0, // auto-fill
              isItemSelectBorderEn: 1,
              itemName: ['Hello World', 'Device Info', 'Audio Test'],
            }),
            isEventCapture: 1, // this container receives input events
          }),
        ],
        textObject: [
          new TextContainerProperty({
            xPosition: 300,
            yPosition: 20,
            width: 256,
            height: 248,
            borderWidth: 1,
            borderColor: 3,
            borderRdaius: 3,
            paddingLength: 8,
            containerID: 2,
            containerName: 'info-text',
            content: 'Welcome to EvenHub! Select an item from the list.',
            isEventCapture: 0,
          }),
        ],
      }),
    );

    log(`createStartUpPageContainer result: ${result} (0=success)`);
  } catch (err) {
    log(`createStartUpPageContainer error: ${err}`);
  }

  // ── Listen for device status changes ────────────────────────────

  bridge.onDeviceStatusChanged((status: DeviceStatus) => {
    log(`Device status changed: connect=${status.connectType}, battery=${status.batteryLevel}%`);
    if (status.connectType === DeviceConnectType.Disconnected) {
      log('  Device disconnected!');
    }
  });

  // ── Listen for EvenHub events (list selection, text, sys, audio)

  bridge.onEvenHubEvent(async (event: EvenHubEvent) => {
    if (event.listEvent) {
      const item = event.listEvent;
      log(`List event: "${item.currentSelectItemName}" (index=${item.currentSelectItemIndex}, type=${item.eventType})`);

      // Update the text container based on selection
      if (item.eventType === OsEventTypeList.CLICK_EVENT) {
        let content = '';
        switch (item.currentSelectItemIndex) {
          case 0:
            content = 'Hello from EvenHub! This is a simple demo app exploring the G2 SDK.';
            break;
          case 1:
            try {
              const device = await bridge.getDeviceInfo();
              content = device
                ? `Model: ${device.model}\nSN: ${device.sn}\nBattery: ${device.status.batteryLevel}%\nWearing: ${device.status.isWearing}`
                : 'No device info available';
            } catch {
              content = 'Error getting device info';
            }
            break;
          case 2:
            content = 'Audio test: Long-press to start mic.\n(audioControl not yet wired)';
            break;
          default:
            content = `Selected item ${item.currentSelectItemIndex}`;
        }

        try {
          await bridge.textContainerUpgrade(
            new TextContainerUpgrade({
              containerID: 2,
              containerName: 'info-text',
              content,
            }),
          );
          log(`Updated text to: "${content.slice(0, 40)}..."`);
        } catch (err) {
          log(`textContainerUpgrade error: ${err}`);
        }
      }
    }

    if (event.textEvent) {
      log(`Text event: container=${event.textEvent.containerName}, type=${event.textEvent.eventType}`);
    }

    if (event.sysEvent) {
      log(`System event: type=${event.sysEvent.eventType}`);
      if (event.sysEvent.eventType === OsEventTypeList.FOREGROUND_EXIT_EVENT) {
        log('  App went to background');
      }
    }

    if (event.audioEvent) {
      log(`Audio: ${event.audioEvent.audioPcm.length} bytes PCM`);
    }
  });

  setStatus('App running — check glasses display');
  log('Setup complete. Listening for events...');
}

main();
