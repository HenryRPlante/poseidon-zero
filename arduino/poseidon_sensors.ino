#include "DFRobot_PH.h"
#include <EEPROM.h>
#include <OneWire.h>
#include <DallasTemperature.h>

#define TINY_GSM_MODEM_SIM7000
#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>

#if defined(ARDUINO_AVR_UNO) || defined(ARDUINO_AVR_NANO)
#include <SoftwareSerial.h>
#endif

// ========== PIN DEFINITIONS ==========
#define PH_PIN A1
#define TDS_PIN A0
#define EC_PIN A2
#define ONE_WIRE_BUS 7

// ========== MODEM / SERVER CONFIG ==========
#define MODEM_BAUD 9600
#define SERVER_HOST "YOUR_SERVER_HOST_OR_IP"
#define SERVER_PORT 5000
#define SERVER_PATH "/api/sensors"

#define APN "YOUR_APN"
#define APN_USER ""
#define APN_PASS ""

// Botletics profile selection (set one to 1, the other to 0)
#define BOTLETICS_PROFILE_UNO_NANO 1
#define BOTLETICS_PROFILE_FEATHER 0

#if defined(ARDUINO_AVR_UNO) || defined(ARDUINO_AVR_NANO)
#if BOTLETICS_PROFILE_UNO_NANO
// Common UNO/Nano software-serial mapping for SIM7000 breakouts
#define MODEM_RX_PIN 8
#define MODEM_TX_PIN 9
#define MODEM_PWRKEY_PIN 5
#define MODEM_RST_PIN 6
#else
#error "For AVR UNO/Nano, BOTLETICS_PROFILE_UNO_NANO must be 1"
#endif

SoftwareSerial modemSerial(MODEM_RX_PIN, MODEM_TX_PIN);
#define MODEM_STREAM modemSerial
#else
// Feather/MKR-style hardware serial profile
#if BOTLETICS_PROFILE_FEATHER
#define MODEM_PWRKEY_PIN 5
#define MODEM_RST_PIN 6
#define MODEM_STREAM Serial1
#else
#define MODEM_PWRKEY_PIN 5
#define MODEM_RST_PIN 6
#define MODEM_STREAM Serial1
#endif
#endif

// ========== SENSOR OBJECTS ==========
DFRobot_PH ph;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);
TinyGsm modem(MODEM_STREAM);
TinyGsmClient gsmClient(modem);
HttpClient http(gsmClient, SERVER_HOST, SERVER_PORT);

// ========== STATE VARIABLES ==========
bool running = true;  // Battery mode: run autonomously by default
unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 30000;  // Battery mode: read every 30 seconds
const bool SERIAL_DEBUG = false;              // Set true for USB debugging
const int HTTP_RETRIES = 3;

String inputString = "";

// ========== SENSOR READINGS ==========
float voltagePH, phValue = 0.0;
float voltageTDS, tdsValue = 0.0;
float voltageEC, ecValue = 0.0;
float temperature = 25.0;

// ========== FUNCTION DECLARATIONS ==========
bool initModem();
bool ensureCellularConnected();
int getSignalStrength();
String buildPayload(int signalStrength);
bool postToServer(const String &payload);

// ========== SETUP ==========
void setup()
{
  Serial.begin(9600);
  delay(250);

#if defined(ARDUINO_AVR_UNO) || defined(ARDUINO_AVR_NANO)
  MODEM_STREAM.begin(MODEM_BAUD);
#else
  MODEM_STREAM.begin(MODEM_BAUD);
#endif

  pinMode(MODEM_PWRKEY_PIN, OUTPUT);
  pinMode(MODEM_RST_PIN, OUTPUT);
  digitalWrite(MODEM_PWRKEY_PIN, LOW);
  digitalWrite(MODEM_RST_PIN, HIGH);
  
  // Initialize sensors
  ph.begin();
  sensors.begin();

  initModem();
  
  // Print startup message
  if (SERIAL_DEBUG)
  {
    Serial.println("\n========================================");
    Serial.println("Poseidon Zero - Sensor Monitor");
    Serial.println("========================================");
    Serial.println("Mode: Autonomous battery mode");
    Serial.println("Sensor Pins: pH=A1, TDS=A0, EC=A2, Temp=D7");
    Serial.println("Commands: 'start', 'stop', 'status', 'help'");
    Serial.println("========================================\n");
  }
  
  delay(250);
}

// ========== MAIN LOOP ==========
void loop()
{
  // Optional command handling when USB serial is attached
  handleSerialInput();

  // Autonomous periodic sensor loop
  if (running)
  {
    if (millis() - lastSensorRead >= SENSOR_INTERVAL)
    {
      lastSensorRead = millis();
      readAllSensors();
      outputSensorData();

      int signalStrength = getSignalStrength();
      String payload = buildPayload(signalStrength);
      postToServer(payload);
    }
  }
}

bool initModem()
{
  digitalWrite(MODEM_RST_PIN, LOW);
  delay(120);
  digitalWrite(MODEM_RST_PIN, HIGH);
  delay(500);

  digitalWrite(MODEM_PWRKEY_PIN, HIGH);
  delay(1200);
  digitalWrite(MODEM_PWRKEY_PIN, LOW);
  delay(3000);

  bool ok = modem.restart();
  if (SERIAL_DEBUG)
  {
    if (ok)
    {
      Serial.println("[MODEM] SIM7000 restarted");
    }
    else
    {
      Serial.println("[MODEM] Restart failed");
    }
  }

  if (!ok)
  {
    return false;
  }

  return ensureCellularConnected();
}

bool ensureCellularConnected()
{
  if (!modem.isNetworkConnected())
  {
    if (SERIAL_DEBUG)
    {
      Serial.println("[MODEM] Waiting for network...");
    }
    if (!modem.waitForNetwork(60000L))
    {
      if (SERIAL_DEBUG)
      {
        Serial.println("[MODEM] Network registration failed");
      }
      return false;
    }
  }

  if (!modem.isGprsConnected())
  {
    if (SERIAL_DEBUG)
    {
      Serial.println("[MODEM] Connecting APN...");
    }
    if (!modem.gprsConnect(APN, APN_USER, APN_PASS))
    {
      if (SERIAL_DEBUG)
      {
        Serial.println("[MODEM] APN connect failed");
      }
      return false;
    }
  }

  return true;
}

int getSignalStrength()
{
  int quality = modem.getSignalQuality();
  if (quality <= 0 || quality == 99)
  {
    return -1;
  }
  long dbm = -113 + (2L * quality);
  return (int)dbm;
}

String buildPayload(int signalStrength)
{
  String payload = "{\"data\":{";
  payload += "\"temperature\":" + String(temperature, 1);
  payload += ",\"ph\":" + String(phValue, 2);
  payload += ",\"tds\":" + String(tdsValue, 0);
  payload += ",\"ec\":" + String(ecValue, 3);

  if (signalStrength != -1)
  {
    payload += ",\"signalStrength\":" + String(signalStrength);
  }

  payload += "}}";
  return payload;
}

bool postToServer(const String &payload)
{
  for (int attempt = 1; attempt <= HTTP_RETRIES; attempt++)
  {
    if (!ensureCellularConnected())
    {
      delay(1500);
      continue;
    }

    http.stop();
    http.beginRequest();
    http.post(SERVER_PATH);
    http.sendHeader("Content-Type", "application/json");
    http.sendHeader("Content-Length", payload.length());
    http.beginBody();
    http.print(payload);
    http.endRequest();

    int statusCode = http.responseStatusCode();
    String body = http.responseBody();

    if (SERIAL_DEBUG)
    {
      Serial.print("[HTTP] Status: ");
      Serial.println(statusCode);
      if (body.length() > 0)
      {
        Serial.print("[HTTP] Body: ");
        Serial.println(body);
      }
    }

    if (statusCode == 200)
    {
      return true;
    }

    modem.gprsDisconnect();
    delay(1500);
  }

  return false;
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
        Serial.print("[STATUS] Mode: BATTERY_AUTONOMOUS+CELLULAR | Running: ");
        Serial.println(running ? "YES" : "NO");
        Serial.print("[STATUS] Network: ");
        Serial.println(modem.isNetworkConnected() ? "REGISTERED" : "NOT_REGISTERED");
        Serial.print("[STATUS] GPRS: ");
        Serial.println(modem.isGprsConnected() ? "CONNECTED" : "DISCONNECTED");
      }
      else if (inputString == "info")
      {
        Serial.println("\n========== DEVICE INFO ==========");
        Serial.println("Device: Poseidon Zero Water Quality Monitor");
        Serial.println("Version: 1.1 (SIM7000 uplink)");
        Serial.println("Sensors: pH, TDS, EC, Temperature");
        Serial.println("Update Interval: 30000ms");
        Serial.print("Server: ");
        Serial.print(SERVER_HOST);
        Serial.print(":");
        Serial.print(SERVER_PORT);
        Serial.print(SERVER_PATH);
        Serial.println();
        Serial.println("==================================\n");
      }
      else if (inputString == "help")
      {
        Serial.println("\n========== AVAILABLE COMMANDS ==========");
        Serial.println("start    - Start sensor readings");
        Serial.println("stop     - Stop sensor readings");
        Serial.println("status   - Show current status");
        Serial.println("info     - Show device information");
        Serial.println("reconnect- Reconnect cellular session");
        Serial.println("help     - Show this help message");
        Serial.println("========================================\n");
      }
      else if (inputString == "reconnect")
      {
        modem.gprsDisconnect();
        bool ok = ensureCellularConnected();
        Serial.println(ok ? "[COMMAND] Reconnected" : "[COMMAND] Reconnect failed");
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
  if (SERIAL_DEBUG || Serial)
  {
    Serial.print(temperature, 1);
    Serial.print(" | ");
    Serial.print(phValue, 2);
    Serial.print(" | ");
    Serial.print(tdsValue, 0);
    Serial.print(" | ");
    Serial.print(ecValue, 3);
    Serial.println();
  }
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
