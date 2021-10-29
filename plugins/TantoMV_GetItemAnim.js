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
 * @param Play Pickup Sounds
 * @desc Whether or not sounds should be played when the player obtains an item.
 * @type boolean
 * @default true
 * @on Yes
 * @off No
 * @parent == Pickup Sound ==
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
 * @param Play Animation by Default
 * @desc Whether the animation should be automatically played by default or has to be enabled manually using Note Tags.
 * @type boolean
 * @default true
 * @on Yes
 * @off No
 * @parent == Display Options ==
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
 * 
 * @help
 * ==============================================================================
 * # General Introduction
 * ==============================================================================
 * 
 * This Plugin adds the option of displaying a short animation which plays when
 * the player picks up an item, showing which item and which quantity the player
 * picked up in a small notification above the character.
 * 
 * ==============================================================================
 * # Usage
 * ==============================================================================
 * 
 * # Pickup Animations
 * 
 * By default the plugin is configured to display the animation for every item
 * that is picked up. In most cases however, this is not what you want. You can
 * change the "Play Animation by Default" option in order to change this
 * behavior.
 * 
 * In order to only show animations for specific items, you can use the following
 * note tag on every item you want to display the animation for:
 * 
 *     <GetItemAnimation>
 * 
 * When an item with this note tag is picked up, the animation always plays.
 * 
 * The item icon is always shown in the animation, however, you can choose if the
 * name of the item should be shown using either the "Show Item Name" parameter
 * or by adding the following note tag to an item:
 * 
 *     <GetItemShowName>
 * 
 * 
 * # Pickup Sounds
 * 
 * The plugin, also by default, plays an SE whenever an item is picked up.
 * You can reconfigure the default sound file, volume, pitch and pan in the
 * parameters. If you want to turn off pickup sounds entirely, you can do so
 * by changing the "Play Pickup Sounds" parameter.
 * 
 * You can change all settings listed above using the following note tags too:
 * 
 *      <GetItemSound:Item3>
 *      <GetItemSoundVolume:90>
 *      <GetItemSoundPitch:90>
 *      <GetItemSoundPan:-50>
 * 
 * (These values are all examples and can be changed as needed.)
 * 
 * * NOTE: An item which has a GetItemSound note tag will always play a pickup
 *         sound no matter what the "Play Pickup Sounds" parameter is set to.
 * 
 */
//======================================================================================================================


(function() {
    let param = PluginManager.parameters("TantoMV_GetItemAnim");
    const PLAY_PICKUP_SOUND = eval(param['Play Pickup Sounds']);
    const DEFAULT_PICKUP_SOUND = String(param['Pickup Sound']);
    const DEFAULT_VOLUME = Number(param['Pickup Sound Volume']);
    const DEFAULT_PITCH = Number(param['Pickup Sound Pitch']);
    const DEFAULT_PAN = Number(param['Pickup Sound Pan']);
    const PLAY_BY_DEFAULT = eval(param['Play Animation by Default']);
    const SHOW_ITEM_NAME = eval(param['Show Item Name']);
    const SHOW_WINDOW = eval(param['Show Window']);
    const FONT_SIZE = Number(param['Font Size']);
    const ANIMATION_SPEED = Number(param['Animation Speed']);
    const ANIMATION_DURATION = Number(param['Animation Duration']);
    const ANIMATION_FADEOUT_START = Number(param['Fade Out Delay']);
    const OPACITY_STEP = 255 / (ANIMATION_DURATION - ANIMATION_FADEOUT_START);

    let _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {

        // Play pickup sound effect as defined by the item's note tags (or default values)
        if(PLAY_PICKUP_SOUND || item.meta.GetItemSound) {
            AudioManager.playSe({
                name: item.meta.GetItemSound || DEFAULT_PICKUP_SOUND,
                volume: item.meta.GetItemSoundVolume || DEFAULT_VOLUME,
                pitch: item.meta.GetItemSoundPitch || DEFAULT_PITCH,
                pan: item.meta.GetItemSoundPan || DEFAULT_PAN,
            });
        }

        if(item.meta.GetItemAnimation || PLAY_BY_DEFAULT) {

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
        }

        // Call base function to actually add item to inventory
        _Game_Party_gainItem.bind($gameParty, item, amount, includeEquip)();
    }
})();