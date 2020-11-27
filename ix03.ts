namespace ix03
{

/*uint8_t i2cwrite(uint16_t address, uint8_t reg, uint8_t *data, int len)
{
    int i2c_error_status = 0;
#ifdef CODAL_I2C
    auto sda = LOOKUP_PIN(SDA);
    auto scl = LOOKUP_PIN(SCL);
    codal::I2C *i2c = pxt::getI2C(sda, scl);
#endif
    uint8_t val[len + 1];
    val[0] = reg;
    for (uint8_t i = 0; i < len; i++)
    {
        val[i + 1] = data[i];
    }
#ifdef CODAL_I2C
    return i2c_error_status = i2c->write((uint16_t)address, (uint8_t *)&val, len + 1, false);
#else
    return i2c_error_status = uBit.i2c.write(address, (BUFFER_TYPE)val, len + 1, false);
#endif
}

uint8_t i2cread(uint16_t address, uint8_t reg, uint8_t *data, int len)
{
    uint8_t val[1] = {reg};
#ifdef CODAL_I2C
    auto sda = LOOKUP_PIN(SDA);
    auto scl = LOOKUP_PIN(SCL);
    codal::I2C *i2c = pxt::getI2C(sda, scl);
#endif
    int i2c_error_status = 0;

#ifdef CODAL_I2C
    i2c_error_status = i2c->write((uint16_t)address, (uint8_t*)&reg, 1, true);
#else
    i2c_error_status = uBit.i2c.write(address, (BUFFER_TYPE)&val, 1, true);
#endif

#ifdef CODAL_I2C
    return i2c_error_status = i2c->read((uint16_t)address, (uint8_t*)&data, len, false);
#else
    return i2c_error_status = uBit.i2c.read(address, (BUFFER_TYPE)data, len, false);
#endif
}

void delay(uint16_t time_ms)
{
#ifdef CODAL_I2C
    sleep_ms(time_ms);
#else
    uBit.sleep(time_ms);
#endif
}*/

/*xIX03::xIX03()
{
    i2cAddr = SC16IS740_I2C_ADDR << 1;
}

xIX03::xIX03(uint8_t addr)
{
    i2cAddr = addr << 1;
}*/


let i2cAddr: NumberFormat.UInt8LE = 0
let SC16IS740_I2C_ADDR: NumberFormat.UInt8LE = 0x4D
let SC16IS740_RHR = 0x00
let SC16IS740_THR = 0x00
let SC16IS740_IER = 0x01
let SC16IS740_FCR = 0x02
let SC16IS740_IIR = 0x02
let SC16IS740_LCR = 0x03
let SC16IS740_MCR = 0x04
let SC16IS740_LSR = 0x05
let SC16IS740_MSR = 0x06
let SC16IS740_SPR = 0x07
let SC16IS740_TCR = 0x06
let SC16IS740_TLR = 0x07
let SC16IS740_TXLVL = 0x08
let SC16IS740_RXLVL = 0x09
let SC16IS740_IODIR = 0x0A
let SC16IS740_IOSTATE = 0x0B
let SC16IS740_IOINTENA = 0x0C
let SC16IS740_RESERVED = 0x0D
let SC16IS740_IOCONTROL = 0x0E
let SC16IS740_EFCR = 0x0F
let SC16IS740_DLL = 0x00
let SC16IS740_DLH = 0x01
let SC16IS740_EFR = 0x02
let SC16IS740_XON1 = 0x04
let SC16IS740_XON2 = 0x05
let SC16IS740_XOFF1 = 0x06
let SC16IS740_XOFF2 = 0x07

let DEC = 1
let OUTPUT = 1
let HIGH = 1


export function begin(baudRate: NumberFormat.UInt16LE): boolean
{
	i2cAddr = SC16IS740_I2C_ADDR << 1
    resetDevice();
    FIFOEnable(1);
    setBaudRate(baudRate);
    config();
	
    return true;
}

export function config()
{
    writeByte(SC16IS740_LCR, 0x03); // SERIAL_8N1
}

export function setBaudRate(baudRate: NumberFormat.UInt16LE)
{
    let old_data: NumberFormat.UInt8LE = 0
	let new_data: NumberFormat.UInt8LE = 0
	
    let divisor: number = ((1.8432 * 1000000) / (baudRate * 16))
    //uint8_t baud_low = (uint8_t)(divisor);
	let baud_low: NumberFormat.UInt8LE = divisor
    //uint8_t baud_hi = (uint8_t)(divisor >> 8);
	let baud_hi: NumberFormat.UInt8LE = divisor >> 8
    //old_data = readByte(SC16IS740_LCR);
	old_data = readByte(SC16IS740_LCR)
    new_data |= 0x80;
    writeByte(SC16IS740_LCR, new_data);
    writeByte(SC16IS740_DLL, baud_low);
    writeByte(SC16IS740_DLH, baud_hi);
    writeByte(SC16IS740_LCR, 0x7F);
}

export function resetDevice()
{
    let reg: NumberFormat.UInt8LE;
    reg = readByte(SC16IS740_IOCONTROL);
    reg |= 0x08;
    writeByte(SC16IS740_IOCONTROL, reg);
}

/*bool xIX03::ping()
{
    writeByte(SC16IS740_SPR, 0x99);
    if (readByte(SC16IS740_SPR) != 0x99)
        return false;
    return true;
}*/

export function FIFOEnable(fifo_enable: NumberFormat.UInt8LE)
{
    let temp_fcr: NumberFormat.UInt8LE = readByte(SC16IS740_FCR);
    if (fifo_enable == 0)
        temp_fcr &= ~(1 << 1);
    else
        temp_fcr |= 1 << 1;
    writeByte(SC16IS740_FCR, temp_fcr);
}

export function readLSR(): boolean
{
    let tmp_lsr:NumberFormat.UInt8LE = 0;
    do
    {
        tmp_lsr = readByte(SC16IS740_LSR);
    } while ((tmp_lsr & 0x20) == 0);
    return true;
}
/*
void xIX03::write(uint8_t val)
{
    if (readLSR())
        writeByte(SC16IS740_THR, val);
}

void xIX03::write(const char *str)
{
    if (readLSR())
        writeBlock(SC16IS740_THR, (uint8_t *)str, 20);
}

*/
export function write(buffer: Buffer, size: number)
{
    if (readLSR())
        pins.i2cWriteBuffer(i2cAddr, buffer, false)
}

/*void xIX03::write(const char *buffer, uint8_t size)
{
    if (readLSR())
        writeBlock(SC16IS740_THR, (uint8_t *)buffer, size);
}

void xIX03::flush()
{
    uint8_t reg = readByte(SC16IS740_FCR);
    writeByte(SC16IS740_FCR, reg | 0x06);
}*/



export function available(): NumberFormat.UInt8LE
{
    return readByte(SC16IS740_RXLVL);
}

/*uint8_t xIX03::availableForWrite()
{
    return 64 - readByte(SC16IS740_TXLVL);
}*/



export function read(): NumberFormat.UInt8LE
{
    if (available() == 0)
        return 0;
    return readByte(SC16IS740_RHR);
}
/*
void xIX03::end()
{
}
*/
export function pinMode(pin: NumberFormat.UInt8LE, mode: NumberFormat.UInt8LE)
{
    let _reg: NumberFormat.UInt8LE = readByte(SC16IS740_IODIR);
    if (mode == OUTPUT)
    {
        _reg |= 1 << pin;
    }
    else
    {
        _reg &= ~(1 << pin);
    }
    writeByte(SC16IS740_IODIR, _reg);
}

export function digitalWrite(pin: NumberFormat.UInt8LE, state: NumberFormat.UInt8LE)
{
    let _reg:NumberFormat.UInt8LE = readByte(SC16IS740_IOSTATE);
    if (state == HIGH)
    {
        _reg |= 1 << pin;
    }
    else
    {
        _reg &= ~(1 << pin);
    }
    writeByte(SC16IS740_IOSTATE, _reg);
}
export function digitalRead(pin: number)
{
    let _reg = readByte(SC16IS740_IOSTATE);
    return (_reg & pin) >> pin;
}



export function writeByte(reg: number, val: number)
{
    //uint8_t k[2] = {reg << 3, val};
	
	let k: Buffer = pins.createBuffer(pins.sizeOf(NumberFormat.UInt8LE) * 2)
	k.setNumber(NumberFormat.UInt8LE, 0, reg << 3)
	k.setNumber(NumberFormat.UInt8LE, 1, val)
	
/*#ifdef CODAL_I2C
    auto sda = LOOKUP_PIN(SDA);
    auto scl = LOOKUP_PIN(SCL);
    codal::I2C *i2c = pxt::getI2C(sda, scl);
    i2c->write(i2cAddr, (uint8_t *)k, 2, false);
#else
    uBit.i2c.write(i2cAddr, (BUFFER_TYPE)k, 2, false);
#endif*/

	pins.i2cWriteBuffer(i2cAddr, k, false)

	

}

export function readByte(reg: NumberFormat.UInt8LE): NumberFormat.UInt8LE
{
    //uint8_t val[1] = {reg << 3};
	
	let val: NumberFormat.UInt8LE = (reg << 3)
	
/*#ifdef CODAL_I2C
    uint8_t data[1];
#else
    char data[1];
#endif*/

	let data: NumberFormat.UInt8LE = 0

/*#ifdef CODAL_I2C
    auto sda = LOOKUP_PIN(SDA);
    auto scl = LOOKUP_PIN(SCL);
    codal::I2C *i2c = pxt::getI2C(sda, scl);
    i2c->write(i2cAddr, (uint8_t *)val, 1, true);
    i2c->read(i2cAddr, (uint8_t *)&data, 1, false);
#else
    uBit.i2c.write(i2cAddr, (BUFFER_TYPE)val, 1, true);
    uBit.i2c.read(i2cAddr, (BUFFER_TYPE)data, 1, false);
#endif*/

	pins.i2cWriteNumber(i2cAddr, val, NumberFormat.UInt8LE, true)
	data = pins.i2cReadNumber(i2cAddr, NumberFormat.UInt8LE, false)

    return data
}

/*void xIX03::writeBlock(uint8_t reg, uint8_t *val, uint8_t len)
{
    i2cwrite(i2cAddr, reg << 3, val, len);
    delay(100);
}*/

}
