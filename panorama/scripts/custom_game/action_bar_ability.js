"use strict";

var m_Ability = -1;
var m_QueryUnit = -1;
var m_bInLevelUp = false;

function SetAbility( ability, queryUnit, bInLevelUp )
{
	var bChanged = ( ability !== m_Ability || queryUnit !== m_QueryUnit );
	m_Ability = ability;
	m_QueryUnit = queryUnit;
	m_bInLevelUp = bInLevelUp;
	
	var canUpgradeRet = Abilities.CanAbilityBeUpgraded( m_Ability );
	var canUpgrade = ( canUpgradeRet == AbilityLearnResult_t.ABILITY_CAN_BE_UPGRADED );
	
	$.GetContextPanel().SetHasClass( "no_ability", ( ability == -1 ) );
	$.GetContextPanel().SetHasClass( "learnable_ability", bInLevelUp && canUpgrade );

	RebuildAbilityUI();
	UpdateAbility();
}

function AutoUpdateAbility()
{
	UpdateAbility();
	$.Schedule( 0.1, AutoUpdateAbility );
}

function UpdateAbility()
{
	var abilityButton = $( "#AbilityButton" );
	var abilityName = Abilities.GetAbilityName( m_Ability );

	var noLevel =( 0 == Abilities.GetLevel( m_Ability ) );
	var isCastable = !Abilities.IsPassive( m_Ability ) && !noLevel;
	var manaCost = Abilities.GetManaCost( m_Ability );
	var hotkey = Abilities.GetKeybind( m_Ability, m_QueryUnit );
	var unitMana = Entities.GetMana( m_QueryUnit );

	var isValid = manaCost !== -1;

	$.GetContextPanel().SetHasClass( "no_level", noLevel );
	$.GetContextPanel().SetHasClass( "is_passive", Abilities.IsPassive(m_Ability) && isValid );
	$.GetContextPanel().SetHasClass( "no_mana_cost", ( 0 == manaCost ) );
	$.GetContextPanel().SetHasClass( "insufficient_mana", ( manaCost > unitMana ) );
	$.GetContextPanel().SetHasClass( "auto_cast_enabled", Abilities.GetAutoCastState(m_Ability) && isValid );
	$.GetContextPanel().SetHasClass( "toggle_enabled", Abilities.GetToggleState(m_Ability) && isValid );
	$.GetContextPanel().SetHasClass( "is_active", ( m_Ability == Abilities.GetLocalPlayerActiveAbility() ) && isValid );

	abilityButton.enabled = ( isCastable || m_bInLevelUp && !isValid );
	
	$( "#HotkeyText" ).text = hotkey;
	
	$( "#AbilityImage" ).abilityname = abilityName;
	$( "#AbilityImage" ).contextEntityIndex = m_Ability;
	if(isValid)
		$( "#ManaCost" ).text = manaCost;
	else 
		$( "#ManaCost" ).text = "";

	if(isValid)
		$( "#Hotkey" ).SetHasClass("collapse", false);
	else 
		$( "#Hotkey" ).SetHasClass("collapse", true);
	
	if ( Abilities.IsCooldownReady( m_Ability ) || !isValid )
	{
		$.GetContextPanel().SetHasClass( "cooldown_ready", true );
		$.GetContextPanel().SetHasClass( "in_cooldown", false );
	}
	else
	{
		$.GetContextPanel().SetHasClass( "cooldown_ready", false );
		$.GetContextPanel().SetHasClass( "in_cooldown", true );
		var cooldownLength = Abilities.GetCooldownLength( m_Ability );
		var cooldownRemaining = Abilities.GetCooldownTimeRemaining( m_Ability );
		var cooldownPercent = Math.ceil( 100 * cooldownRemaining / cooldownLength );
		$( "#CooldownTimer" ).text = Math.ceil( cooldownRemaining );
		$( "#CooldownOverlay" ).style.width = cooldownPercent+"%";
	}
}

function AbilityShowTooltip()
{
	var abilityButton = $( "#AbilityButton" );
	var abilityName = Abilities.GetAbilityName( m_Ability );
	// If you don't have an entity, you can still show a tooltip that doesn't account for the entity
	//$.DispatchEvent( "DOTAShowAbilityTooltip", abilityButton, abilityName );
	
	// If you have an entity index, this will let the tooltip show the correct level / upgrade information
	$.DispatchEvent( "DOTAShowAbilityTooltipForEntityIndex", abilityButton, abilityName, m_QueryUnit );
}

function AbilityHideTooltip()
{
	var abilityButton = $( "#AbilityButton" );
	$.DispatchEvent( "DOTAHideAbilityTooltip", abilityButton );
}

function ActivateAbility()
{
	if ( m_bInLevelUp )
	{
		Abilities.AttemptToUpgrade( m_Ability );
		return;
	}
	Abilities.ExecuteAbility( m_Ability, m_QueryUnit, false );
}

function DoubleClickAbility()
{
	// Handle double-click like a normal click - ExecuteAbility will either double-tap (self cast) or normal toggle as appropriate
	ActivateAbility();
}

function RightClickAbility()
{
	if ( m_bInLevelUp )
		return;

	if ( Abilities.IsAutocast( m_Ability ) )
	{
		Game.PrepareUnitOrders( { OrderType: dotaunitorder_t.DOTA_UNIT_ORDER_CAST_TOGGLE_AUTO, AbilityIndex: m_Ability } );
	}
}

function RebuildAbilityUI()
{
	var abilityLevelContainer = $( "#AbilityLevelContainer" );
	abilityLevelContainer.RemoveAndDeleteChildren();
	var currentLevel = Abilities.GetLevel( m_Ability );
	for ( var lvl = 0; lvl < Abilities.GetMaxLevel( m_Ability ); lvl++ )
	{
		var levelPanel = $.CreatePanel( "Panel", abilityLevelContainer, "" );
		levelPanel.AddClass( "LevelPanel" );
		levelPanel.SetHasClass( "active_level", ( lvl < currentLevel ) );
		levelPanel.SetHasClass( "next_level", ( lvl == currentLevel ) );
	}
}

function UnlearnAbility(  )
{
	var player = Players.GetLocalPlayer();
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	GameEvents.SendCustomGameEventToServer( "unlearn_ability", { "player" : player, "unit" : queryUnit, "abilityName": Abilities.GetAbilityName( m_Ability ) } );
}


function OnDragEnter( a, draggedPanel )
{
	// var draggedItem = draggedPanel.data().m_DragItem;
	var draggedItem = draggedPanel.m_DragItem;

	// only care about dragged items other than us
	if ( draggedItem === null || draggedItem == m_Ability )
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
	// draggedPanel.data().m_DragCompleted = true;
	draggedPanel.m_DragCompleted = true;
	
	// item dropped on itself? don't acutally do the swap (but consider the drag completed)
	if ( draggedItem == m_Ability )
		return true;

	// create the order
	// var moveItemOrder =
	// {
	// 	OrderType: dotaunitorder_t.DOTA_UNIT_ORDER_MOVE_ITEM,
	// 	TargetIndex: m_ItemSlot,
	// 	AbilityIndex: draggedItem
	// };
	// Game.PrepareUnitOrders( moveItemOrder );
	return true;
}

function OnDragLeave( panelId, draggedPanel )
{
	// var draggedItem = draggedPanel.data().m_DragItem;
	var draggedItem = draggedPanel.m_DragItem;
	if ( draggedItem === null || draggedItem == m_Ability )
		return false;

	// un-highlight this panel
	$.GetContextPanel().RemoveClass( "potential_drop_target" );
	return true;
}

function OnDragStart( panelId, dragCallbacks )
{
	if ( m_Ability == -1 )
	{
		return true;
	}

	var abilityName = Abilities.GetAbilityName( m_Ability );

	ItemHideTooltip(); // tooltip gets in the way

	// create a temp panel that will be dragged around
	var displayPanel = $.CreatePanel( "DOTAItemImage", $.GetContextPanel(), "dragImage" );
	displayPanel.itemname = abilityName;
	displayPanel.contextEntityIndex = m_Ability;
	displayPanel.m_DragItem = m_Ability;
	displayPanel.m_DragCompleted = false; // whether the drag was successful
	// displayPanel.data().m_DragItem = m_Item;
	// displayPanel.data().m_DragCompleted = false; // whether the drag was successful

	// hook up the display panel, and specify the panel offset from the cursor
	dragCallbacks.displayPanel = displayPanel;
	dragCallbacks.offsetX = 0;
	dragCallbacks.offsetY = 0;
	
	// grey out the source panel while dragging
	$.GetContextPanel().AddClass( "dragging_from" );
	return true;
}

function OnDragEnd( panelId, draggedPanel )
{
	// if the drag didn't already complete, then try dropping in the world
	// if ( !draggedPanel.data().m_DragCompleted )
	if ( !draggedPanel.m_DragCompleted )
	{
		// Game.DropItemAtCursor( m_QueryUnit, m_Item );
	}

	// kill the display panel
	draggedPanel.DeleteAsync( 0 );

	// restore our look
	$.GetContextPanel().RemoveClass( "dragging_from" );
	return true;
}

(function()
{
	$.GetContextPanel().SetAbility = SetAbility;
	GameEvents.Subscribe( "dota_ability_changed", RebuildAbilityUI ); // major rebuild

	$.RegisterEventHandler( 'DragEnter', $.GetContextPanel(), OnDragEnter );
	$.RegisterEventHandler( 'DragDrop', $.GetContextPanel(), OnDragDrop );
	$.RegisterEventHandler( 'DragLeave', $.GetContextPanel(), OnDragLeave );
	$.RegisterEventHandler( 'DragStart', $.GetContextPanel(), OnDragStart );
	$.RegisterEventHandler( 'DragEnd', $.GetContextPanel(), OnDragEnd );
	AutoUpdateAbility(); // initial update of dynamic state
})();
