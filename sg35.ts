

namespace sg35
{
	let STATUS_OK = 1
	let STATUS_WAITING = 0
	let MODE_ACTIVE = 0
	let MODE_PASSIVE = 1
	
	let PM_SP_UG_1_0: NumberFormat.UInt16LE = 0;
    let PM_SP_UG_2_5: NumberFormat.UInt16LE = 0;
    let PM_SP_UG_10_0: NumberFormat.UInt16LE = 0;

    let PM_AE_UG_1_0: NumberFormat.UInt16LE = 0;
    let PM_AE_UG_2_5: NumberFormat.UInt16LE = 0;
    let PM_AE_UG_10_0: NumberFormat.UInt16LE = 0;
	
	let _status = 0;
	let _mode = MODE_ACTIVE;

	let _index = 0;
	let _frameLen = 0;
	let _checksum = 0;
	let _calculatedChecksum = 0;
	
	let _payload = pins.createBuffer(12)
	
	let initialized = false
    let onReceivedDataHandler: (pm1: number, pm25: number, pm10: number) => void;

export function makeWord(b1: NumberFormat.UInt8LE, b2: NumberFormat.UInt8LE): NumberFormat.UInt16LE
{
    return (b1 << 8) | b2;
}

export function begin()
{
    ix03.begin(9600);
    for (let i = 0; i < 4; i++)
    {
        ix03.pinMode(i, 1);
        ix03.digitalWrite(i, 1);
    }
}
/*
// Standby mode. For low power consumption and prolong the life of the sensor.
void PMS::sleep()
{
    uint8_t command[] = {0x42, 0x4D, 0xE4, 0x00, 0x00, 0x01, 0x73};
    _stream->write(command, sizeof(command));
}

// Operating mode. Stable data should be got at least 30 seconds after the sensor wakeup from the sleep mode because of the fan's performance.
void PMS::wakeUp()
{
    uint8_t command[] = {0x42, 0x4D, 0xE4, 0x00, 0x01, 0x01, 0x74};
    _stream->write(command, sizeof(command));
}

// Active mode. Default mode after power up. In this mode sensor would send serial data to the host automatically.
void PMS::activeMode()
{
    uint8_t command[] = {0x42, 0x4D, 0xE1, 0x00, 0x01, 0x01, 0x71};
    _stream->write(command, sizeof(command));
    _mode = MODE_ACTIVE;
}

// Passive mode. In this mode sensor would send serial data to the host only for request.
void PMS::passiveMode()
{
    uint8_t command[] = {0x42, 0x4D, 0xE1, 0x00, 0x00, 0x01, 0x70};
    _stream->write(command, sizeof(command));
    _mode = MODE_PASSIVE;
}

// Request read in Passive Mode.
void PMS::requestRead()
{
    if (_mode == MODE_PASSIVE)
    {
        uint8_t command[] = {0x42, 0x4D, 0xE2, 0x00, 0x00, 0x01, 0x71};
        _stream->write(command, sizeof(command));
    }
}
*/

// Non-blocking function for parse response.
export function read(): boolean
{
    loop();

    return _status == STATUS_OK;
}

//% blockId="PM1"
//% block="SG35 get PM1.0"
export function pm1():NumberFormat.UInt16LE
{
	return PM_AE_UG_1_0;
}

//% blockId="PM25"
//% block="SG35 get PM2.5"
export function pm25():NumberFormat.UInt16LE
{
	return PM_AE_UG_2_5;
}

//% blockId="PM10"
//% block="SG35 get PM10.0"
export function pm10():NumberFormat.UInt16LE
{
	return PM_AE_UG_10_0;
}

/*
// Blocking function for parse response. Default timeout is 1s.
bool PMS::readUntil(DATA &data, uint16_t timeout)
{
    _data = &data;
    uint32_t start = system_timer_current_time();
    do
    {
        loop();
        if (_status == STATUS_OK)
            break;
    } while (system_timer_current_time() - start < timeout);
    //_stream->flush();
    return _status == STATUS_OK;
}
*/

export function loop()
{
    _status = STATUS_WAITING;
    if (ix03.available())
    {
        let ch = ix03.read();

        switch (_index)
        {
        case 0:
            if (ch != 0x42)
            {
                return;
            }
            _calculatedChecksum = ch;
            break;

        case 1:
            if (ch != 0x4D)
            {
                _index = 0;
                return;
            }
            _calculatedChecksum += ch;
            break;

        case 2:
            _calculatedChecksum += ch;
            _frameLen = ch << 8;
            break;

        case 3:
            _frameLen |= ch;
            // Unsupported sensor, different frame length, transmission error e.t.c.
            if (_frameLen != 2 * 9 + 2 && _frameLen != 2 * 13 + 2)
            {
                _index = 0;
                return;
            }
            _calculatedChecksum += ch;
            break;

        default:
            if (_index == _frameLen + 2)
            {
                _checksum = ch << 8;
            }
            else if (_index == _frameLen + 2 + 1)
            {
                _checksum |= ch;

                if (_calculatedChecksum == _checksum)
                {
                    _status = STATUS_OK;

                    // Standard Particles, CF=1.
                    //PM_SP_UG_1_0 = makeWord(_payload[0], _payload[1]);
					PM_SP_UG_1_0 = makeWord(_payload.getNumber(NumberFormat.UInt8LE, 0), _payload.getNumber(NumberFormat.UInt8LE, 1))
                    //PM_SP_UG_2_5 = makeWord(_payload[2], _payload[3]);
					PM_SP_UG_2_5 = makeWord(_payload.getNumber(NumberFormat.UInt8LE, 2), _payload.getNumber(NumberFormat.UInt8LE, 3))
                    //PM_SP_UG_10_0 = makeWord(_payload[4], _payload[5]);
					PM_SP_UG_10_0 = makeWord(_payload.getNumber(NumberFormat.UInt8LE, 4), _payload.getNumber(NumberFormat.UInt8LE, 5))

                    // Atmospheric Environment.
                    //PM_AE_UG_1_0 = makeWord(_payload[6], _payload[7]);
					PM_AE_UG_1_0 = makeWord(_payload.getNumber(NumberFormat.UInt8LE, 6), _payload.getNumber(NumberFormat.UInt8LE, 7))
                    //PM_AE_UG_2_5 = makeWord(_payload[8], _payload[9]);
					PM_AE_UG_2_5 = makeWord(_payload.getNumber(NumberFormat.UInt8LE, 8), _payload.getNumber(NumberFormat.UInt8LE, 9))	
                    //PM_AE_UG_10_0 = makeWord(_payload[10], _payload[11]);
					PM_AE_UG_10_0 = makeWord(_payload.getNumber(NumberFormat.UInt8LE, 10), _payload.getNumber(NumberFormat.UInt8LE, 11))
                }

                _index = 0;
                return;
            }
            else
            {
                _calculatedChecksum += ch;
                let payloadIndex = _index - 4;

                // Payload is common to all sensors (first 2x6 bytes).
                if (payloadIndex < _payload.length)
                {
                    //_payload[payloadIndex] = ch;
					_payload.setNumber(NumberFormat.UInt8LE, payloadIndex, ch)
                }
            }

            break;
        }

        _index++;
    }
}

let j = 0

    function init() {

        control.inBackground(function(){
                while(true)
                {
                    console.logValue("status", _status)
                    let rcv = read()
                    if(rcv)
                    {
                        onReceivedDataHandler(pm1(), pm25(), pm10())
                    }
                    basic.pause(1)
                }
        })
    }

    //% block="SG35 on received "
    //% draggableParameters=reporter
    export function onReceivedData(cb: (receivedPM1: number,receivedPM25: number,receivedPM10: number) => void): void {
        init()
        onReceivedDataHandler = cb
    }
	
	begin();

} // namespace sg35
