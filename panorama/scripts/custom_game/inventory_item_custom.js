"use strict";

var SLOTS = {
	0: "main-hand",
	1: "off-hand",
	2: "head",
	3: "cape",
	4: "body",
	5: "feat"
}

var m_Item = {};
var m_QueryUnit = -1;

function UpdateItem()
{
	if(m_Item.item) {
		$( "#ItemImage" ).itemname = m_Item.item.ItemName;
		$.GetContextPanel().SetHasClass( "no_item", (m_Item.item === undefined) );
		$.GetContextPanel().SetHasClass( "show_charges", !!m_Item.item.Consumable );
		$( "#ChargeCount" ).text = 1;
	} else {
		$( "#ItemImage" ).itemname = undefined;
		$.GetContextPanel().SetHasClass( "no_item", true );
		$.GetContextPanel().SetHasClass( "show_charges", false );
		$( "#ChargeCount" ).text = undefined;
	}
}

function ItemShowTooltip()
{
	if ( m_Item.item === undefined)
		return;

	var itemName = m_Item.item.ItemName;
	$.DispatchEvent( "DOTAShowAbilityTooltipForEntityIndex", $.GetContextPanel(), itemName, m_QueryUnit );
}

function ItemHideTooltip()
{
	$.DispatchEvent( "DOTAHideAbilityTooltip", $.GetContextPanel() );
}

function ActivateItem()
{
	if ( m_Item.item === undefined )
		return;

	// Items are abilities - just execute the ability
	if( m_Item.item.ActiveModifier && !m_Item.item.Consumable ) {
		var player = Players.GetLocalPlayer();
		GameEvents.SendCustomGameEventToServer( "activate_modifier", { "player" : player, "unit" : m_QueryUnit, "modifierName": m_Item.item.ActiveModifier, "abilityName": m_Item.item.ItemName } );
	}
	UpdateItem();
}

function DoubleClickItem()
{
	if ( m_Item.item === undefined )
		return;

	if( m_Item.item.Consumable && m_Item.item.ActiveModifier ) {
		var player = Players.GetLocalPlayer();
		GameEvents.SendCustomGameEventToServer( "activate_modifier", { "player" : player, "unit" : m_QueryUnit, "modifierName": m_Item.item.ActiveModifier, "abilityName": m_Item.item.ItemName } );
		if( m_Item.item.PassiveModifier ) {
			GameEvents.SendCustomGameEventToServer( "remove_modifier", { "player" : player, "unit" : m_QueryUnit, "modifierName": m_Item.item.PassiveModifier, "abilityName": m_Item.item.ItemName } );
		}
		m_Item.item = undefined;
	}
	UpdateItem();
}

function IsInStash()
{

}

function RightClickItem()
{
	
}

function OnDragEnter( a, draggedPanel )
{
	// var draggedItem = draggedPanel.data().m_DragItem;
	var draggedItem = draggedPanel.m_DragItem;

	// only care about dragged items other than us
	if ( draggedItem === null || draggedItem == m_Item.item )
		return true;

	// highlight this panel as a drop target
	$.GetContextPanel().AddClass( "potential_drop_target" );
	return true;
}

function OnDragDrop( panelId, draggedPanel )
{
	// var draggedItem = draggedPanel.data().m_DragItem;
	var draggedItem = draggedPanel.m_DragItem;
	
	// only care about dragged items other than us
	if ( draggedItem === null )
		return true;

	// executing a slot swap - don't drop on the world
	draggedPanel.m_DragCompleted = true;
	
	if(m_Item.isWearing && SLOTS[m_Item.slot] !== undefined && SLOTS[m_Item.slot] !== draggedItem.Slot) {
		draggedPanel.m_DragFailed = true;
		return true;
	}

	// item dropped on itself? don't acutally do the swap (but consider the drag completed)
	var player = Players.GetLocalPlayer();
	if( !draggedPanel.isWearing && m_Item.isWearing ) {
		if( draggedItem.PassiveModifier ) {
			GameEvents.SendCustomGameEventToServer( "activate_modifier", { "player" : player, "unit" : m_QueryUnit, "modifierName": draggedItem.PassiveModifier, "abilityName": draggedItem.ItemName } );
		}
		GameEvents.SendCustomGameEventToServer( "attach_prop", { "player" : player, "unit" : m_QueryUnit, "attach": draggedItem.Attach, "model": draggedItem.Model } );
	}
	if( draggedPanel.isWearing && !m_Item.isWearing) {
		if( draggedItem.PassiveModifier ) {
			GameEvents.SendCustomGameEventToServer( "remove_modifier", { "player" : player, "unit" : m_QueryUnit, "modifierName": draggedItem.PassiveModifier, "abilityName": draggedItem.ItemName } );
		}
		GameEvents.SendCustomGameEventToServer( "remove_prop", { "player" : player, "unit" : m_QueryUnit, "attach": draggedItem.Attach, "model": draggedItem.Model } );
	}
	if(m_Item.item !== undefined)
		draggedPanel.m_SwapItem = m_Item.item;
	// create the order
	m_Item.item = draggedItem;
	UpdateItem();
	return true;
}

function OnDragLeave( panelId, draggedPanel )
{
	var draggedItem = draggedPanel.m_DragItem;
	if ( draggedItem === null || draggedItem == m_Item.item )
		return false;

	// un-highlight this panel
	$.GetContextPanel().RemoveClass( "potential_drop_target" );
	return true;
}

function OnDragStart( panelId, dragCallbacks )
{
	if ( m_Item.item === undefined )
	{
		return true;
	}

	ItemHideTooltip(); // tooltip gets in the way

	// create a temp panel that will be dragged around
	var displayPanel = $.CreatePanel( "DOTAItemImage", $.GetContextPanel(), "dragImage" );
	displayPanel.itemname = m_Item.ItemName;
	// displayPanel.contextEntityIndex = m_Item;
	displayPanel.m_DragItem = m_Item.item;
	displayPanel.m_DragCompleted = false; // whether the drag was successful
	displayPanel.m_SwapItem = undefined;
	displayPanel.isWearing = m_Item.isWearing;

	// hook up the display panel, and specify the panel offset from the cursor
	dragCallbacks.displayPanel = displayPanel;
	dragCallbacks.offsetX = 0;
	dragCallbacks.offsetY = 0;
	
	// grey out the source panel while dragging
	$.GetContextPanel().AddClass( "dragging_from" );
	return true;
}

function SendMeStats() {
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	var player = Players.GetLocalPlayer()
	GameEvents.SendCustomGameEventToServer( "get_unit_stats", { "player" : player, "unit" : queryUnit } );
}

function OnDragEnd( panelId, draggedPanel )
{
	// if the drag didn't already complete, then try dropping in the world
	if( !draggedPanel.m_DragFailed ) {
		if ( !draggedPanel.m_DragCompleted )
		{
			var player = Players.GetLocalPlayer();
			GameEvents.SendCustomGameEventToServer( "drop_item", { "player" : player, "unit" : m_QueryUnit, "itemName": m_Item.item.ItemName, "at": GameUI.GetCursorPosition() } );
			if(m_Item.item.PassiveModifier && m_Item.isWearing) {
				GameEvents.SendCustomGameEventToServer( "remove_modifier", { "player" : player, "unit" : m_QueryUnit, "modifierName": m_Item.item.PassiveModifier, "abilityName": m_Item.item.ItemName } );
			}
			if(m_Item.isWearing) {
				GameEvents.SendCustomGameEventToServer( "remove_prop", { "player" : player, "unit" : m_QueryUnit, "attach": m_Item.item.Attach, "model": m_Item.item.Model } );
			}
			m_Item.item = undefined;
		} else {
			m_Item.item = draggedPanel.m_SwapItem;
		}
	}

	// restore our look
	$.GetContextPanel().RemoveClass( "dragging_from" );

	// kill the display panel
	draggedPanel.DeleteAsync( 0 );
	UpdateItem();
	SendMeStats();
	return true;
}

function SetItem( queryUnit, item )
{
	if (item)
		m_Item = item;
	m_QueryUnit = queryUnit;
	Initialise();
	UpdateItem()
}

function SetRemoveItemFunc( func )
{
	removeFromInventory = func;
}

function Initialise() {
	if(m_Item.isWearing){
		if( m_Item.slot == 0 )
			$( "#InventoryIcon" ).SetImage("file://{images}/hud/reborn/icon_damage.psd");
		if( m_Item.slot == 1 )
			$( "#InventoryIcon" ).SetImage("file://{images}/hud/reborn/icon_armor.psd");
		if( m_Item.slot == 2 )
			$( "#InventoryIcon" ).SetImage("file://{images}/helmet.png");
		if( m_Item.slot == 3 ) 
			$( "#InventoryIcon" ).SetImage("file://{images}/cape.png");
		if( m_Item.slot == 4 )
			$( "#InventoryIcon" ).SetImage("file://{images}/armour.png");
		if( m_Item.slot == 5 )
			$( "#InventoryIcon" ).SetImage("file://{images}/hud/reborn/icon_speed.psd");
	}
}

(function()
{
	// $.Msg($.GetContextPanel().data());
	// $.GetContextPanel().data().SetItem = SetItem;
	// $.GetContextPanel().data().SetItemSlot = SetItemSlot;
	$.GetContextPanel().SetItem = SetItem;
	// Drag and drop handlers ( also requires 'draggable="true"' in your XML, or calling panel.SetDraggable(true) )
	$.RegisterEventHandler( 'DragEnter', $.GetContextPanel(), OnDragEnter );
	$.RegisterEventHandler( 'DragDrop', $.GetContextPanel(), OnDragDrop );
	$.RegisterEventHandler( 'DragLeave', $.GetContextPanel(), OnDragLeave );
	$.RegisterEventHandler( 'DragStart', $.GetContextPanel(), OnDragStart );
	$.RegisterEventHandler( 'DragEnd', $.GetContextPanel(), OnDragEnd );
	UpdateItem(); // initial update of dynamic state
})();
