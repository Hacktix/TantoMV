//======================================================================================================================
// TantoMV - GetItemAnim.js
//======================================================================================================================

var TantoMV = TantoMV || {};
TantoMV.GetItemAnim = 1.0;

//======================================================================================================================
/*:
 * @plugindesc A plugin which adds small animations for picking up items without needing an extra message box.
 * @author Hacktix
 * 
 * @param == Pickup Sound ==
 * @default
 * 
 * @param Pickup Sound
 * @desc The name of the sound which should be played by default when an item is picked up.
 * @default Item3
 * @type file
 * @dir /audio/se
 * @parent == Pickup Sound ==
 * 
 * @param Pickup Sound Volume
 * @desc The volume of the sound which should be played by default when an item is picked up. (Default: 100)
 * @default 100
 * @type number
 * @parent == Pickup Sound ==
 * 
 * @param Pickup Sound Pitch
 * @desc The pitch of the sound which should be played by default when an item is picked up. (Default: 100)
 * @default 100
 * @type number
 * @parent == Pickup Sound ==
 * 
 * @param Pickup Sound Pan
 * @desc The pan of the sound which should be played by default when an item is picked up. (Default: 0)
 * @default 0
 * @type number
 * @parent == Pickup Sound ==
 * 
 * 
 * 
 * @param == Display Options ==
 * @default
 * 
 * @param Show Item Name
 * @desc Whether or not the name of the item which has been picked up should be shown.
 * @type boolean
 * @default true
 * @on Yes
 * @off No
 * @parent == Display Options ==
 * 
 * @param Show Window
 * @desc Whether or not the window frame should be shown in the background of the animation.
 * @type boolean
 * @default false
 * @on Yes
 * @off No
 * @parent == Display Options ==
 * 
 * @param Font Size
 * @desc The font size of the text which should be displayed.
 * @type number
 * @default 20
 * @parent == Display Options ==
 * 
 * 
 * 
 * @param == Animation Options ==
 * @default
 * 
 * @param Animation Speed
 * @desc A factor determining how fast or slow the window should move. Negative values make the window move down.
 * @type number
 * @decimals 2
 * @default 1.00
 * @parent == Animation Options ==
 * 
 * @param Animation Duration
 * @desc The duration of the animation in frames.
 * @type number
 * @default 60
 * @parent == Animation Options ==
 * 
 * @param Fade Out Delay
 * @desc The amount of frames the text is shown at full opacity before it starts fading out.
 * @type number
 * @default 30
 * @parent == Animation Options ==
 */
//======================================================================================================================


(function() {
    let param = PluginManager.parameters("TantoMV_GetItemAnim");
    const DEFAULT_PICKUP_SOUND = String(param['Pickup Sound']);
    const DEFAULT_VOLUME = Number(param['Pickup Sound Volume']);
    const DEFAULT_PITCH = Number(param['Pickup Sound Pitch']);
    const DEFAULT_PAN = Number(param['Pickup Sound Pan']);
    const SHOW_ITEM_NAME = eval(param['Show Item Name']);
    const SHOW_WINDOW = eval(param['Show Window']);
    const FONT_SIZE = Number(param['Font Size']);
    const ANIMATION_SPEED = Number(param['Animation Speed']);
    const ANIMATION_DURATION = Number(param['Animation Duration']);
    const ANIMATION_FADEOUT_START = Number(param['Fade Out Delay']);
    const OPACITY_STEP = 255 / (ANIMATION_DURATION - ANIMATION_FADEOUT_START);

    console.log(param)

    let _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {

        // Play pickup sound effect as defined by the item's note tags (or default values)
        AudioManager.playSe({
            name: item.meta.GetItemSound || DEFAULT_PICKUP_SOUND,
            volume: item.meta.GetItemSoundVolume || DEFAULT_VOLUME,
            pitch: item.meta.GetItemSoundPitch || DEFAULT_PITCH,
            pan: item.meta.GetItemSoundPan || DEFAULT_PAN,
        });

        // Initialize window for icons and text
        let animWindow = new Window_Base(0, 0, Graphics.width, Graphics.height);
        if(!SHOW_WINDOW) {
            animWindow.padding = 0;
            animWindow.setBackgroundType(-1);
        }
        animWindow.contents.fontSize = FONT_SIZE;

        // Draw icon and text and calculate window width
        const winText = (item.meta.GetItemShowName || SHOW_ITEM_NAME) ? `+${amount} ${item.name}` : `+${amount}`;
        const winHeight = Math.max(70, 1.5 * animWindow.contents.fontSize);
        const winWidth = animWindow.textWidth(winText) + 64 + 1.25 * animWindow.padding;
        animWindow.drawIcon(item.iconIndex, 0, 0);
        animWindow.drawText(winText, 48, 0);

        // Define animation loop for window
        let step = 0;
        function updateAnimWindow() {
            // Move window to next position
            let x = $gamePlayer.screenX() - (winWidth / 2);
            let y = $gamePlayer.screenY() - (1.5 * $gameMap.tileHeight()) - (((step++) / 3) * ANIMATION_SPEED);
            animWindow.move(x, y, winWidth, winHeight);

            // Decrease opacity after initial delay
            if(step >= ANIMATION_FADEOUT_START)
                animWindow.contentsOpacity -= OPACITY_STEP;

            // Check if animation should be finished, re-run next frame if not, otherwise close window
            if(step < ANIMATION_DURATION)
                requestAnimationFrame(updateAnimWindow);
            else
                animWindow.close();
        }
        updateAnimWindow(); // Initially set position of window

        // Add window to scene and enqueue animation loop
        SceneManager._scene.addWindow(animWindow);
        requestAnimationFrame(updateAnimWindow);

        // Call base function to actually add item to inventory
        _Game_Party_gainItem.bind($gameParty, item, amount, includeEquip)();
    }
})();