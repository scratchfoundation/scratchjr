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
        this.rssi = 0;
        this.servos = 0;
        this.accel = 0;
        this.commandPromise = null;
        this.onCommandReply = this.onCommandReply.bind(this);
        this.sendCommand = this.sendCommand.bind(this);
        this.saveScratchFile = this.saveScratchFile.bind(this);
        this.loadScratchFile = this.loadScratchFile.bind(this);
        this.listSavedScratchFiles = this.listSavedScratchFiles.bind(this);
        this.deleteScratchFile = this.deleteScratchFile.bind(this);
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
        newHTML = "Connected to " + this.martyName + "<br />Battery " + this.battRemainCapacityPercent + "%, signal " + this.rssi;
        document.getElementById('martyConnection').classList.add("martyConnected");
      } else {
        newHTML = "Not connected";
        document.getElementById('martyConnection').classList.remove("martyConnected");
      }
      document.getElementById('martyConnection').innerHTML = newHTML;
    }
}

module.exports = Marty2;
