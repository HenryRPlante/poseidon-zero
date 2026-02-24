#include "DFRobot_PH.h"
#include <EEPROM.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ========== PIN DEFINITIONS ==========
#define PH_PIN A1
#define TDS_PIN A0
#define EC_PIN A2
#define ONE_WIRE_BUS 7

// ========== USB DETECTION ==========
// For Arduino boards: Check if USB is powered
// AVR-based boards can detect VBUS on certain pins
#if defined(__AVR__)
  #define USB_VBUS_PIN 8  // Connect USB 5V to pin 8 with a resistor divider (optional)
  #define USB_CONNECTED LOW  // Will be LOW when USB provides power
#endif

// Alternative: Use DTR/RTS signals for USB serial monitoring
volatile boolean usb_connected = false;

// ========== SENSOR OBJECTS ==========
DFRobot_PH ph;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// ========== STATE VARIABLES ==========
bool running = false;
bool wasConnected = false;
unsigned long lastSensorRead = 0;
unsigned long lastStatusCheck = 0;
const unsigned long SENSOR_INTERVAL = 1000;      // Read sensors every 1 second
const unsigned long STATUS_CHECK_INTERVAL = 5000; // Check USB every 5 seconds

String inputString = "";

// ========== SENSOR READINGS ==========
float voltagePH, phValue = 0.0;
float voltageTDS, tdsValue = 0.0;
float voltageEC, ecValue = 0.0;
float temperature = 25.0;

// ========== SETUP ==========
void setup()
{
  Serial.begin(9600);
  
  // Wait for serial connection to establish
  delay(1500);
  
  // Initialize USB detection
  #if defined(__AVR__)
    pinMode(USB_VBUS_PIN, INPUT);
  #endif
  
  // Initialize sensors
  ph.begin();
  sensors.begin();
  
  // Print startup message
  Serial.println("\n========================================");
  Serial.println("Poseidon Zero - Sensor Monitor");
  Serial.println("========================================");
  Serial.println("Sensor Pins: pH=A1, TDS=A0, EC=A2, Temp=D7");
  Serial.println("Waiting for USB connection...");
  Serial.println("Commands: 'start', 'stop', 'status'");
  Serial.println("========================================\n");
  
  delay(1000);
}

// ========== MAIN LOOP ==========
void loop()
{
  // Check USB connection status periodically
  if (millis() - lastStatusCheck >= STATUS_CHECK_INTERVAL)
  {
    lastStatusCheck = millis();
    checkUSBConnection();
  }

  // -------- SERIAL COMMAND HANDLER --------
  handleSerialInput();

  // Only run sensor readings if USB is connected
  if (usb_connected && running)
  {
    if (millis() - lastSensorRead >= SENSOR_INTERVAL)
    {
      lastSensorRead = millis();
      readAllSensors();
      outputSensorData();
    }
  }
}

// ========== USB CONNECTION DETECTION ==========
void checkUSBConnection()
{
  // Check if Serial port is available
  // On most Arduino boards, Serial is available when connected via USB
  bool isConnected = (Serial);
  
  // Additional check: if you connected USB power detection via pin 8
  #if defined(__AVR__)
    // Uncomment if using hardware USB detection pin
    // isConnected = isConnected && (digitalRead(USB_VBUS_PIN) == USB_CONNECTED);
  #endif
  
  // Detect change in connection status
  if (isConnected != usb_connected)
  {
    usb_connected = isConnected;
    
    if (usb_connected)
    {
      Serial.println("\n[USB] Device connected!");
      Serial.println("[STATUS] Ready to receive commands");
      running = false;  // Start in stopped state
    }
    else
    {
      usb_connected = false;
      running = false;
      // Cannot print when not connected
    }
  }
}

// ========== SERIAL COMMAND HANDLER ==========
void handleSerialInput()
{
  if (Serial.available() > 0)
  {
    inputString = Serial.readStringUntil('\n');
    inputString.trim();
    inputString.toLowerCase();

    if (inputString.length() > 0)
    {
      if (inputString == "start")
      {
        running = true;
        Serial.println("[COMMAND] Sensors STARTED");
        Serial.println("[HEAD] Temp(C) | pH | TDS(ppm) | EC(mS/cm)");
        Serial.println("---------|------|---------|----------");
      }
      else if (inputString == "stop")
      {
        running = false;
        Serial.println("[COMMAND] Sensors STOPPED");
      }
      else if (inputString == "status")
      {
        Serial.print("[STATUS] USB: ");
        Serial.print(usb_connected ? "CONNECTED" : "DISCONNECTED");
        Serial.print(" | Running: ");
        Serial.println(running ? "YES" : "NO");
      }
      else if (inputString == "info")
      {
        Serial.println("\n========== DEVICE INFO ==========");
        Serial.println("Device: Poseidon Zero Water Quality Monitor");
        Serial.println("Version: 1.0");
        Serial.println("Sensors: pH, TDS, EC, Temperature");
        Serial.println("Update Interval: 1000ms");
        Serial.println("==================================\n");
      }
      else if (inputString == "help")
      {
        Serial.println("\n========== AVAILABLE COMMANDS ==========");
        Serial.println("start    - Start sensor readings");
        Serial.println("stop     - Stop sensor readings");
        Serial.println("status   - Show current status");
        Serial.println("info     - Show device information");
        Serial.println("help     - Show this help message");
        Serial.println("========================================\n");
      }
      else
      {
        Serial.print("[ERROR] Unknown command: '");
        Serial.print(inputString);
        Serial.println("' (type 'help' for available commands)");
      }
    }
  }
}

// ========== SENSOR READING FUNCTIONS ==========
void readAllSensors()
{
  // -------- TEMPERATURE --------
  sensors.requestTemperatures();
  temperature = sensors.getTempCByIndex(0);

  if (temperature == DEVICE_DISCONNECTED_C)
  {
    temperature = 25.0;  // Fallback safe value
  }

  // -------- PH --------
  voltagePH = analogRead(PH_PIN) / 1024.0 * 5000;
  phValue = ph.readPH(voltagePH, temperature);

  // -------- TDS --------
  voltageTDS = analogRead(TDS_PIN) * (5.0 / 1023.0);
  tdsValue = (133.42 * voltageTDS * voltageTDS * voltageTDS
             - 255.86 * voltageTDS * voltageTDS
             + 857.39 * voltageTDS) * 0.5;

  // -------- EC --------
  voltageEC = analogRead(EC_PIN) * (5.0 / 1023.0);
  ecValue = voltageEC * 3.5;  // Simple scale factor
}

// ========== SENSOR OUTPUT FUNCTIONS ==========
void outputSensorData()
{
  // Formatted output for easy parsing
  Serial.print(temperature, 1);
  Serial.print(" | ");
  Serial.print(phValue, 2);
  Serial.print(" | ");
  Serial.print(tdsValue, 0);
  Serial.print(" | ");
  Serial.print(ecValue, 3);
  Serial.println();
}

// ========== JSON OUTPUT (Optional - for future API integration) ==========
void outputJSON()
{
  Serial.print("{\"temp\":");
  Serial.print(temperature);
  Serial.print(",\"pH\":");
  Serial.print(phValue);
  Serial.print(",\"tds\":");
  Serial.print(tdsValue);
  Serial.print(",\"ec\":");
  Serial.print(ecValue);
  Serial.println("}");
}
