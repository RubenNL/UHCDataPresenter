/* jshint esversion:6 */

//#region Data fetching

const url = "http://localhost:8081/data.json";

setInterval(() => {
    update();
},50);

function failedConnect(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response.text();
}

function update() {
    fetch(url, {
        mode: 'cors'
    })
    .then(failedConnect)
    .then(function (response) {
        parseData(data = response);
    }).catch(function (error) {
        throw error;
    });
}

//#endregion

//#region Framework

class DataContainer {
    constructor(capacity, width, height, itemHeight, inverted, {top, right, bottom, left}) {
        this.capacity = capacity;
        this.itemHeight = itemHeight;
        let container = this.container = document.createElement("div");
        container.classList.add("data-container");

        this.inverted = inverted;

        document.body.append(container);

        this.items = [];

        container.style.width = width + "px";
        container.style.height = height + "px";

        let cnt = !!top + !!right + !!bottom + !!left;

        if (cnt > 2) console.log("NOTE: Container was created with more than 2 absolute position values set.");

        if (top) container.style.top = top + "px";
        if (right) container.style.right = right + "px";
        if (bottom) container.style.bottom = bottom + "px";
        if (left) container.style.left = left + "px";
    }

    addItem(item) {
        // create item
        let wrap = document.createElement("div");
        wrap.classList.add("data-container-wrap");

        let it = document.createElement("div");
        it.classList.add("data-container-item");

        wrap.appendChild(it);

        
        wrap.style.marginTop = (this.inverted ? "" : "-") + 
            (wrap.style.height = 
                it.style.height = this.itemHeight + "px");

        wrap.style.opacity = 0;
        
        it.append(item);

        if (this.inverted) {
            this.container.append(wrap);
            // items functions as a queue
            this.items.push(wrap);
        }
        else {
            this.container.insertBefore(wrap, this.container.firstChild);
            // items functions as a backwards queue
            this.items.splice(0, 0, wrap);
        }

        this.animateIn(wrap);

        if (this.items.length > this.capacity) {
            if (this.inverted) {
                this.removeAtIndex(0, true);
            }
            else {
                this.removeAtIndex(this.capacity, true);
            }
        }           
    }

    animateIn(wrap) {
        console.log(wrap);

        wrap.style.display = "block";
        wrap.style.height = this.itemHeight + "px";

        $(wrap).animate({
            marginTop: 0,
            opacity: 1,
        }, 400);
    }

    removeItem(item) {
        var index;
        if ((index = this.items.findIndex(x => x.firstChild.firstChild === item)) != -1) {
            this.removeAtIndex(index);
        }            
    }

    removeAtIndex(index, onlyHide = false) {
        if (index < 0) return;

        let removed = !onlyHide ? 
            this.items.splice(index, 1)[0] :
            this.items[index];

        $(removed).animate({
            opacity: 0,
            height: 0,
        }, 400, () => {
            if (!onlyHide) {
                this.container.removeChild(removed);
            } else {
                removed.style.display = "none";
            }
        });

        if (!onlyHide) {
            // try to reshow one of the hidden items
            if (this.items.length >= this.capacity) {                
                this.animateIn(
                    this.inverted ? this.items[0] : this.items[this.capacity - 1]
                );
            }
        }
    }

    clear() {
        for (var i = 0; i < this.items.length; ++i) this.removeAtIndex(i);
    }
}

class PlayerBox {    
    constructor(player, color, health = 20) {
        let templ = document.getElementById("player-box-template").cloneNode(true);
        templ.removeAttribute("id");

        this.element = templ;

        this.barTop = this.element.getElementsByClassName("player-box-bar-top")[0];
        this.barBottom = this.element.getElementsByClassName("player-box-bar-bottom")[0];
        this.barBorder = this.element.getElementsByClassName("player-box-border")[0];

        this.setPlayer(player);
        this.setHealth(health);
        this.setColor(color);

    }

    getBox() {
        return this.element;
    }

    getColor() {
        return this.color;
    }

    setColor(color) {
        if (color == this.color) return;

        this.color = color;
        this.barTop.style.backgroundColor = color;
    }

    getPlayer() {
        return this.player;
    }

    setPlayer(player) {
        this.player = player;
        this.element.getElementsByClassName("player-box-player")[0].innerHTML = player;
    }

    getHealth() {
        return this.health;
    }

    // Sets the player's health and returns the change in health.
    setHealth(health) {
        if (health == this.health) return 0;
        let delta = health - this.health;

        this.health = health;
        this.element.getElementsByClassName("player-box-health")[0].innerHTML = health + "/20";

        // get width
        let width = playersWidth;

        let widthProp = width * Math.min(health, 20) / 20;
        // update bar
        this.barTop.style.width = widthProp + "px";

        if (this.curInterval) window.clearInterval(this.curInterval);

        // if player is healing, flash the entire bar
        if (delta > 0) {
            this.barBottom.style.width = width + "px";
        }

        // flash bottom bar
        let i = 0;
        this.curInterval = setInterval(() => {

            this.barBorder.style.display = this.barBottom.style.display =
                i % 2 ? "none" : "block";

            if (i == 6) { // now set the width of it
                this.barBorder.style.display = "none";
                this.barBottom.style.width = widthProp + "px";
                window.clearInterval(this.curInterval);
                this.curInterval = undefined;
            }

            ++i;
        }, 200);

        return delta;
    }
}

//#endregion

const deathCauses = {
    "death.fell.accident.ladder": "Falling off Ladder",
    "death.fell.accident.vines": "Falling off Vines",
    "death.fell.accident.weeping_vines": "Falling off Vines",
    "death.fell.accident.twisting_vines": "Falling off Vines",
    "death.fell.accident.scaffolding": "Falling off Scaffolding",
    "death.fell.accident.other_climbable": "Falling off while Climbing",
    "death.fell.accident.generic": "Fall Damage",
    "death.attack.lightningBolt": "Lightning",
    "death.attack.inFire": "Fire",
    "death.attack.onFire": "Fire",
    "death.attack.lava": "Lava",
    "death.attack.hotFloor": "Magma",
    "death.attack.inWall": "Suffocation",
    "death.attack.cramming": "Cramming",
    "death.attack.drown": "Drowning",
    "death.attack.starve": "Starvation",
    "death.attack.cactus": "Cactus",
    "death.attack.generic": "Generic Death",
    "death.attack.explosion": "Explosion",
    "death.attack.magic": "Magic",
    "death.attack.wither": "Withering",
    "death.attack.anvil": "Anvil",
    "death.attack.fallingBlock": "Falling Block",
    "death.attack.fall": "Fall Damage",
    "death.attack.outOfWorld": "Void",
    "death.attack.dragonBreath": "Dragon Breath",
    "death.attack.flyIntoWall": "Kinetic Energy",
    "death.attack.fireworks": "Fireworks",
    "death.attack.badRespawnPoint.message": "Being Dumb",
    "death.attack.sweetBerryBush": "Sweet Berry Bush",
    "death.attack.sting": "Bees"
};

const deathTemplate = document.getElementById("death-box-template");
function generateDeathContainer(player, attacker, key, time) {
    let templ = deathTemplate.cloneNode(true);
    templ.removeAttribute("id");

    templ.getElementsByClassName("death-box-player")[0].innerHTML = player;

    attacker = attacker.includes('.') || attacker.includes('%') ? deathCauses[key] : attacker;
    templ.getElementsByClassName("death-box-attacker")[0].innerHTML = attacker;

    if (players[player]) {
        templ.getElementsByClassName("death-box-player-team")[0].style.color = players[player].color;
    }

    if (key.includes(".player") && players[attacker]) {
        let attackerDot = templ.getElementsByClassName("death-box-attacker-team")[0];
        attackerDot.style.color = players[attacker].color;
        attackerDot.style.display = "inline";
    }

    // handle time
    let t = new Date(time * 1000);
    let hours = t.getUTCHours();
    let mins =  ('0' + t.getUTCMinutes()).substr(-2);

    templ.getElementsByClassName("death-box-time")[0].innerHTML = hours + ":" + mins;

    return templ;
}

const deathsWidth = 270;
const playersWidth = 220;

const playersHeight = 36;

var deathContainer = new DataContainer(3, deathsWidth, 108, 36, false, {top:14, right:16});

const leftPadding = 0;

const playersCount = 4;
var playersContainer = new DataContainer(playersCount, playersWidth, playersHeight * playersCount, playersHeight, false, {top:14, left:16 + leftPadding});

const damageCount = 8;
var damageContainer = new DataContainer(damageCount, playersWidth, playersHeight * damageCount, playersHeight, false, {top:14, left:16*2 + playersWidth + leftPadding});

var players = {};
var teamPlayers = {};
var healthDiffs = {};

var containers = [deathContainer, playersContainer, damageContainer];

// initial opacity set to hidden
containers.forEach(c => {
    c.container.style.opacity = "0";
});

var currentPlayer;
var lastDeathsLength = 0;
var lastStarted = false;

function parseData(data) {
    let json = JSON.parse(data);
    let deaths = json.deaths;

    let tempPlayers = json.players;
    currentPlayer = json.curPlayer;

    // all players:

    // copy dict to track which players have been removed
    playersCopy = {};
    let isFindingDeleted = false;
    if (Object.keys(players).length > json.players.length) {
        Object.assign(playersCopy, players);
        isFindingDeleted = true;
    }

    tempPlayers.forEach(player => {
        let p = players[player.name];
        if (!p) {
            p = (players[player.name] = new PlayerBox(player.name, player.teamColor, player.health));
        }

        if (isFindingDeleted) {
            playersCopy[player.name] = 0;
        }

        let healthDiff = p.setHealth(player.health);
        p.setColor(player.teamColor);

        // only add players that are in the current player's team
        if (p.color == currentPlayer.teamColor && p.color != "#ffffff") {
            if (!teamPlayers[player.name]) {
                playersContainer.addItem(p.getBox());
                teamPlayers[player.name] = p;
            }
        } else {
            // remove players not in the current player's team
            if (teamPlayers[player.name]) {
                playersContainer.removeItem(p.getBox());
                delete teamPlayers[player.name];
            }
        }

        // If there is a health difference, temporarily display them on screen
        if (healthDiff < 0 && p.color != currentPlayer.teamColor) {

            if (healthDiffs[p.player]) {
                window.clearTimeout(healthDiffs[p.player]);
            }
            else {
                damageContainer.addItem(p.getBox());
            }
            healthDiffs[p.player] = setTimeout((p) => {
                damageContainer.removeItem(p.getBox()); // remove
                delete healthDiffs[p.player]; // unregister
            }, 4000, p);
        }
    });

    if (isFindingDeleted) {
        for (const [name, player] of Object.entries(playersCopy)) {
            if (player) {
                playersContainer.removeItem(player.getBox());
                delete players[name];
                delete teamPlayers[name];
            } 
        }
    }

    // now handle deaths
    let latestLen = json.deaths.length;
    let diff = latestLen - lastDeathsLength;

    // if it was cleared in the game
    if (json.deaths.length == 0) {
        deathContainer.clear();
    }
    else if (diff > 0) {
        for (var i = lastDeathsLength; i < latestLen; ++i) {
            let generated = generateDeathContainer(deaths[i].name, deaths[i].attacker, deaths[i].key, deaths[i].time);
            deathContainer.addItem(generated);
        }
    }

    // hide data if it is not started
    if (json.started != lastStarted) {
        containers.forEach(c => {
            $(c.container).animate({
                opacity: (json.started ? 1 : 0) // don't use implicit conversion here
            }, 400);
        });
    }
    lastStarted = json.started;


    lastDeathsLength = latestLen;
}

// for testing
function addItem(text) {
    let d = document.createElement('div');
    d.style.width = "100%";
    d.style.height = "100%";
    d.style.backgroundColor = "#ff0000";
    d.innerHTML = text;
    playersContainer.addItem(d);
}