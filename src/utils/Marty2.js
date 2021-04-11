/**
 * @fileoverview
 * Functions for interacting with Marty v2 via a REST interface
 */
class EventDispatcher {
    constructor () {
        this._listeners = [];
    }

    hasEventListener (type, listener) {
        return this._listeners.some(item => item.type === type && item.listener === listener);
    }

    addEventListener (type, listener) {
        if (!this.hasEventListener(type, listener)) {
            this._listeners.push({type, listener, options: {once: false}});
        }
        return this;
    }

    removeEventListener (type, listener) {
        const index = this._listeners.findIndex(item => item.type === type && item.listener === listener);
        if (index >= 0) this._listeners.splice(index, 1);
        return this;
    }

    removeEventListeners () {
        this._listeners = [];
        return this;
    }

    dispatchEvent (evt) {
        this._listeners
            .filter(item => item.type === evt.type)
            .forEach(item => {
                const {type, listener, options: {once}} = item;
                listener.call(this, evt);
                if (once === true) this.removeEventListener(type, listener)
            });
        return this;
    }
}


class Marty2 extends EventDispatcher {
    constructor () {
        super();
        this.isConnected = false;
        this.ip = null;
        this.martyName = null;
        this.demo_sensor = 0;
        this.battRemainCapacityPercent = 0;
        this.rssi = -100;
        this.servos = 0;
        this.accel = 0;
//        this.commandPromise = null;
//        this.onCommandReply = this.onCommandReply.bind(this);
//        this.sendCommand = this.sendCommand.bind(this);
        this.setRSSI = this.setRSSI.bind(this);
    }

    setName(martyName){
      this.martyName = martyName;
    }

    setRSSI (rssi) {
        if (rssi !== this.rssi) {
            this.rssi = rssi;
            this.dispatchEvent({type: 'onRSSIChange', rssi: this.rssi});
        }
    }

    setBattRemainCapacityPercent (battRemainCapacityPercent) {
        if (battRemainCapacityPercent !== this.battRemainCapacityPercent) {
            this.battRemainCapacityPercent = battRemainCapacityPercent;
            this.dispatchEvent({type: 'onBattRemainCapacityPercentChange', battRemainCapacityPercent: this.battRemainCapacityPercent});
        }
    }

    setIsConnected (isConnected) {
        if (isConnected !== this.isConnected) {
            this.isConnected = isConnected;
            this.dispatchEvent({type: 'onIsConnectedChange', isConnected: this.isConnected});
        }
    }

    updateConnectionInfo(){
      let newHTML = "";
      if (this.isConnected){
        newHTML = this.martyName +  "<div style='display:flex;height:50%'>" + this.battery_render() + this.signal_render() + "</div>";
        document.getElementById('martyConnection').classList.add("martyConnected");
      } else {
        newHTML = "Not connected<br /><span style='font-weight:normal'>Tap to connect</span>";
        document.getElementById('martyConnection').classList.remove("martyConnected");
      }
      document.getElementById('martyConnection').innerHTML = newHTML;
    }

    battery_getBorderColor (batteryPercent) {
        if (batteryPercent >= 70) {
            return 'black';
        }
        if (batteryPercent >= 30) {
            return 'black';
        }
        return 'rgb(255,69,0)';
    }

    battery_getFillColor (batteryPercent) {
        if (batteryPercent >= 70) {
            return 'lime';
        }
        if (batteryPercent >= 30) {
            return 'orange';
        }
        return 'red';
    }

    battery_render () {
        const batteryPercent = this.battRemainCapacityPercent;
        const borderColor = this.battery_getBorderColor(batteryPercent);
        const fillColor = this.battery_getFillColor(batteryPercent);
        const flash = batteryPercent < 20 ? 'battery-flash' : '';
        return `
            <div
                class="${flash} battery-container"
            >
                <div
                    class="battery-cap"
                    style="background-color: ${borderColor}"
                ></div>
                <div
                    class="battery-cylinder"
                    style="border-color: ${borderColor}"
                >
                    <div
                        style="background-color: ${fillColor}; width: 100%; height: ${Math.round(batteryPercent)}%"
                    ></div>
                </div>
            </div>`;
    }

    signal_render () {
        const rssi = this.rssi;
        const flash = rssi == 0 ? 'signal-flash': '';
        return `
            <div
                class="${flash} signal-strength-container"
            >
                <div
                    class="signal-bar"
                    style="background-color: ${rssi >= -100 ? 'black' : 'lightgray'}; height: 20%"
                ></div>
                <div
                    class="signal-bar"
                    style="background-color: ${rssi >= -80 ? 'black' : 'lightgray'}; height: 40%"
                ></div>
                <div
                    class="signal-bar"
                    style="background-color: ${rssi >= -70 ? 'black' : 'lightgray'}; height: 60%"
                ></div>
                <div
                    class="signal-bar"
                    style="background-color: ${rssi >= -60 ? 'black' : 'lightgray'}; height: 80%"
                ></div>
                <div
                    class="signal-bar"
                    style="background-color: ${rssi >= -50 ? 'black' : 'lightgray'}; height: 100%"
                ></div>
            </div>`;
    }

}

module.exports = Marty2;
