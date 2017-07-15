"use strict";

var m_InventoryPanels = []

// Currently hardcoded: first 6 are inventory, next 6 are stash items
var DOTA_ITEM_STASH_MIN = 6;
var DOTA_ITEM_STASH_MAX = 12;

function UpdateInventory()
{
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	for ( var i = 0; i < DOTA_ITEM_STASH_MAX; ++i )
	{
		var inventoryPanel = m_InventoryPanels[i]
		var item = Entities.GetItemInSlot( queryUnit, i );
		inventoryPanel.SetItem( queryUnit, item );
	}
}

function CreateInventoryPanels()
{
	var stashPanel = $( "#stash" );
	var inventoryPanel = $( "#inventory" );
	if ( !stashPanel || !inventoryPanel )
		return;

	stashPanel.RemoveAndDeleteChildren();
	inventoryPanel.RemoveAndDeleteChildren();
	m_InventoryPanels = []

	for ( var i = 0; i < DOTA_ITEM_STASH_MAX; ++i )
	{
		var parentPanel = inventoryPanel;
		if ( i >= DOTA_ITEM_STASH_MIN ) 
		{
			parentPanel = stashPanel;
		}

		var inventoryItemPanel = $.CreatePanel( "Panel", parentPanel, "" );
		inventoryItemPanel.BLoadLayout( "file://{resources}/layout/custom_game/inventory_item.xml", false, false );
		inventoryItemPanel.SetItemSlot( i );

		m_InventoryPanels.push( inventoryItemPanel );
	}
}


(function()
{
	CreateInventoryPanels();
	UpdateInventory();

	GameEvents.Subscribe( "dota_inventory_changed", UpdateInventory );
	GameEvents.Subscribe( "dota_inventory_item_changed", UpdateInventory );
	GameEvents.Subscribe( "m_event_dota_inventory_changed_query_unit", UpdateInventory );
	GameEvents.Subscribe( "m_event_keybind_changed", UpdateInventory );
	GameEvents.Subscribe( "dota_player_update_selected_unit", UpdateInventory );
	GameEvents.Subscribe( "dota_player_update_query_unit", UpdateInventory );
})();

