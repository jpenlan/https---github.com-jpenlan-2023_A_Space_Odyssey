class ObeliskBattle extends Phaser.Scene{
    constructor() {
        super('obeliskScene');
    }

    preload() {
        this.load.audio('music', './assets/ominous.mp3');
        this.load.image('obelisk', 'assets/obelisk.png');
        this.load.image('warp1', './assets/warp_BG1.png');
        this.load.image('warp2', './assets/warp_BG2.png');
        this.load.audio('select', './assets/select.mp3');
        this.load.audio('hit', './assets/hit.mp3');
    }

    create() {
        this.sound.play('music', { volume: 0.3, repeat: -1});
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.5)');
        this.cameras.main.fadeIn(1000,10,20,30);
        // Add background
        this.bg1 = this.add.tileSprite(0, 0, 320, 240, 'warp1').setOrigin(0, 0);
        this.bg2 = this.add.tileSprite(0, -5, 320, 240, 'warp2').setOrigin(0, 0);
        this.bg3 = this.add.tileSprite(0, -10, 320, 240, 'warp1').setOrigin(0, 0).setAlpha(0.5);

        // Instantiate characters in scene 2
        this.obelisk = new Enemy(this, game.config.width / 2, 75, 'obelisk', 0, 'Obelisk', 999, 5).setScale(0.7);
        this.david = new PlayerCharacter(this, -100, -100, null, 0, 'David', 31, 3);

        this.actions = [ 'Resist', 'Gaze', 'Blink' ];
        this.characters = [ this.david ];
        this.enemies = [ this.obelisk ];

        this.units = this.characters.concat(this.enemies);

        this.scene.launch('UIScene3');

        this.action = 0;

        this.index = -1;

        this.uiScene = this.scene.get('UIScene3');

    }

    update() {
        this.bg1.tilePositionX -= 5;
        this.bg2.tilePositionX -= 7;
        this.bg3.tilePositionX -= 8;

        if (this.david.hp >= 150) {
            this.time.delayedCall(1200, () =>{
                this.cameras.main.fadeOut(1000,10,20,30);
            });
            this.time.delayedCall(2400, () =>{
                this.sound.pauseAll();
                this.scene.start('EndScene');
                this.uiScene.scene.setVisible(false);
                this.scene.destroy('UIScene3');
            });
        }
    }

    nextTurn() {
        console.log(this.units);
        this.index++;
        if(this.index >= this.units.length){
            this.index = 0;
        }
        if(this.units[this.index]) {
            if(this.units[this.index] instanceof PlayerCharacter) { 
                this.events.emit('PlayerSelect', this.index);
            } else {
                    this.r = Math.floor(Math.random() * this.characters.length);
                    this.units[this.index].resist(this.characters[this.r]);
                    this.cameras.main.shake(500)
                    this.sound.play('hit', { volume: 0.9 });
                    this.uiScene.remapCharacters();
                    this.uiScene.remapEnemies();
                    this.time.addEvent({ delay: 2000, callback: this.nextTurn, callbackScope: this});
            }
        }

        // console.log(this.david.hp);
        // console.log(this.hal9000.hp);
    }

    receivePlayerSelection(action, target) {
        if(action == 'resist') {
            this.units[this.index].resist(this.enemies[target]);
            this.cameras.main.flash();
            this.sound.play('hit', { volume: 0.9 });
            this.uiScene.remapCharacters();
            this.uiScene.remapEnemies();
        }
        if(action == 'gaze') {
            this.units[this.index].gaze(this.enemies[0]);
            this.uiScene.remapCharacters();
            this.uiScene.remapEnemies();
        }
        if(action == 'blink') {
            this.units[this.index].blink(this.enemies[0]);
            this.uiScene.remapCharacters();
            this.uiScene.remapEnemies();
        }
        this.time.addEvent({ delay: 3000, callback: this.nextTurn, callbackScope: this});
    }
}

class UIScene3 extends Phaser.Scene {
    constructor() {
        super('UIScene3');
    }

    preload() {
        this.load.spritesheet('selectArrow', './assets/selectArrow.png', {frameWidth: 24, frameHeight: 20, startFrame: 0, endFrame: 1});
    }

    create() {
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(1, 0xffffff);
        this.graphics.fillStyle(0x031f4c, 1);        
        this.graphics.strokeRect(2, 150, 90, 100);
        this.graphics.fillRect(2, 150, 90, 100);
        this.graphics.strokeRect(95, 150, 90, 100);
        this.graphics.fillRect(95, 150, 90, 100);
        this.graphics.strokeRect(188, 150, 130, 100);
        this.graphics.fillRect(188, 150, 130, 100);

        this.menus = this.add.container();

        this.charactersMenu = new PlayerMenu(this, 195, 153);
        this.actionsMenu = new ActionMenu(this, 100, 153);
        this.enemiesMenu = new EnemyMenu(this, 8, 153);

        this.currentMenu = this.actionsMenu;

        // Animation config
        this.anims.create({
            key: 'select',
            frames: this.anims.generateFrameNumbers('selectArrow', { start: 0, end: 1, first: 0}),
            frameRate: 2.5,
            repeat: -1
        })

        this.menus.add(this.charactersMenu);
        this.menus.add(this.actionsMenu);
        this.menus.add(this.enemiesMenu);

        this.battleScene = this.scene.get('obeliskScene');

        this.selector = new MenuArrow(this, 70, 160, 'selectArrow', 0).setScale(0.4);
        this.selector.anims.play('select');
        this.selector.setVisible(false);

        this.remapCharacters();
        this.remapEnemies();
        this.remapActions();

        this.input.keyboard.on('keydown', this.onKeyInput, this);

        this.battleScene.events.on("PlayerSelect", this.onPlayerSelect, this);

        this.events.on("SelectEnemies", this.onSelectEnemies, this);

        this.events.on("Enemy", this.onEnemy, this);

        this.events.on("commitGaze", this.commitGaze, this);

        this.events.on("commitBlink", this.commitBlink, this);

        this.message = new Message(this, this.battleScene.events);
        this.add.existing(this.message);

        this.battleScene.nextTurn();
    }

    onEnemy(index) {
        this.battleScene.receivePlayerSelection('resist', index);
        this.charactersMenu.deselect();
        this.actionsMenu.deselect();
        this.enemiesMenu.deselect();
        this.currentMenu = null;
        this.selector.setVisible(false);
    }

    commitGaze() {
        this.battleScene.receivePlayerSelection('gaze', );
        this.charactersMenu.deselect();
        this.actionsMenu.deselect();
        this.enemiesMenu.deselect();
        this.currentMenu = null;
    }

    commitBlink() {
        this.battleScene.receivePlayerSelection('blink', null);
        this.charactersMenu.deselect();
        this.actionsMenu.deselect();
        this.enemiesMenu.deselect();
        this.currentMenu = null;
    }

    onSelectEnemies() {
        this.currentMenu = this.enemiesMenu;
        this.enemiesMenu.select(0);
        this.selector.setVisible(true);
    }

    onPlayerSelect(id) {
        this.charactersMenu.select(id);
        this.actionsMenu.select(0);
        this.currentMenu = this.actionsMenu;
    }

    onKeyInput(event) {
        if(this.currentMenu) {
            if(event.code === 'ArrowUp') {
                this.currentMenu.moveSelectorUp();
            } 
            else if(event.code === 'ArrowDown') {
                this.currentMenu.moveSelectorDown();
            }
            else if(event.code === 'ArrowRight' || event.code === 'Shift') {
                 
            }
            else if(event.code === 'Space') {
                this.currentMenu.confirm();
                this.sound.play('select', { volume: 0.5 });
            }
        }
    }

    remapCharacters() {
        this.characters = this.battleScene.characters;
        this.charactersMenu.remapCharScene3(this.characters);
    }

    remapEnemies() {
        this.enemies = this.battleScene.enemies;
        this.enemiesMenu.remapEnemScene3(this.enemies);
    }

    remapActions() {
        this.actions = this.battleScene.actions;
        this.actionsMenu.remapAction(this.actions);
    }
}