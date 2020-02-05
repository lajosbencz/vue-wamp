import eventify from '../src/eventify';

describe('eventify', () => {
  const obj = {};
  eventify(obj);

  it('should register listener and then fire it', () => {
    let n = 0;
    let m = 0;
    const g = (i = 1) => n += i;
    const h = (i = 1) => m += i;
    obj.on('i', g);
    obj.on('i', h);
    obj.emit('i');
    expect(n).toBe(1);
    expect(m).toBe(1);
    obj.emit('i');
    expect(n).toBe(2);
    expect(m).toBe(2);
    obj.emit('i', 3);
    expect(n).toBe(5);
    expect(m).toBe(5);
  });

  it('should trigger once', () => {
    let n = 0;
    const g = () => n++;
    obj.once('o', g);
    obj.emit('o');
    expect(n).toBe(1);
    obj.emit('o');
    expect(n).toBe(1);
  });

  it('should remove listener by reference', () => {
    let n = 0;
    const g = () => n++;
    const h = () => n++;
    obj.on('r', g);
    obj.on('r', h);
    obj.emit('r');
    expect(n).toBe(2);
    obj.off('r', g);
    obj.emit('r');
    expect(n).toBe(3);
    obj.off('r', h);
    obj.emit('r');
    expect(n).toBe(3);
  });

  it('should remove all listeners by event name', () => {
    let n = 0;
    const g = () => n++;
    const h = () => n++;
    const w = () => n++;
    obj.on('r', g);
    obj.on('r', h);
    obj.on('w', w);
    obj.emit('r');
    obj.emit('w');
    expect(n).toBe(3);
    obj.off('r');
    obj.emit('r');
    obj.emit('w');
    expect(n).toBe(4);
  });

  it('should remove all listeners attached to object', () => {
    let n = 0;
    const g = () => n++;
    const h = () => n++;
    obj.on('g', g);
    obj.on('h', h);
    obj.emit('g');
    obj.emit('h');
    expect(n).toBe(2);
    obj.off();
    obj.emit('g');
    obj.emit('h');
    expect(n).toBe(2);
  });
});
