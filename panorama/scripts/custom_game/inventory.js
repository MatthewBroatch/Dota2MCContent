"use strict";

var m_Wearing = []
var m_Wearing = []
var m_Inventory = []

// Currently hardcoded: first 6 are inventory, next 6 are stash items
var DOTA_ITEM_WEARING_MAX = 7;
var DOTA_ITEM_INVENTORY_MAX = 16;

function CreateInventoryPanels()
{
	var stashPanel = $( "#stash" );
	var inventoryPanel = $( "#inventory" );
	if ( !stashPanel || !inventoryPanel )
		return;

	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	stashPanel.RemoveAndDeleteChildren();
	inventoryPanel.RemoveAndDeleteChildren();

	for ( var i = 0; i < DOTA_ITEM_WEARING_MAX; ++i )
	{
		var inventoryItemPanel = $.CreatePanel( "Panel", inventoryPanel, "" );
		inventoryItemPanel.BLoadLayout( "file://{resources}/layout/custom_game/inventory_item.xml", false, false );
		inventoryItemPanel.SetItem( queryUnit, m_Wearing[i] );
	}
	for ( var i = 0; i < DOTA_ITEM_INVENTORY_MAX; ++i )
	{
		var inventoryItemPanel = $.CreatePanel( "Panel", stashPanel, "" );
		inventoryItemPanel.BLoadLayout( "file://{resources}/layout/custom_game/inventory_item.xml", false, false );
		inventoryItemPanel.SetItem( queryUnit, m_Inventory[i] );
	}
}

//GetIntrinsicModifierName
function StoreItem(event) {
	var found = 0;
	var slot = undefined;
	for(var i = 0; i < DOTA_ITEM_INVENTORY_MAX; i++) {
		if(m_Inventory[i].item === undefined) {
			slot = m_Inventory[i];
			break;
		}
	}
	if(!slot) {
		var player = Players.GetLocalPlayer();
		var queryUnit = Players.GetLocalPlayerPortraitUnit();
		GameEvents.SendCustomGameEventToServer( "drop_item", { "player" : player, "unit" : queryUnit, "itemName": event.ItemName } );
	} else {
		slot.item = event;
	}
	CreateInventoryPanels();
}

(function()
{

	GameEvents.Subscribe( "hero_picked_up_item", StoreItem );
	for(var i = 0; i < DOTA_ITEM_INVENTORY_MAX; i++)
		m_Inventory.push({ item: undefined, slot: i, isWearing: false });
	for(var i = 0; i < DOTA_ITEM_WEARING_MAX; i++)
		m_Wearing.push({ item: undefined, slot: i, isWearing: true });
	CreateInventoryPanels();

})();