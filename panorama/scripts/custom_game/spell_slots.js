"use strict";

var abilityPanels = [];

function UpdateAbilityList()
{
	var spellSlots = $( "#spell-slots-inner" );
	if ( !spellSlots )
		return;

	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	abilityPanels = [];
	// see if we can change spells
	var bControlsUnit = Entities.IsControllableByPlayer( queryUnit, Game.GetLocalPlayerID() );
	for ( var i = 0; i < Entities.GetAbilityCount( queryUnit ); ++i )
	{
		var ability = Entities.GetAbility( queryUnit, i );
		if ( ability == -1 )
			continue;

		if ( !Abilities.IsDisplayedAbility(ability) )
			continue;
		
		// create a new panel
		var abilityPanel = $.CreatePanel( "Panel", spellSlots, "" );
		abilityPanel.BLoadLayout( "file://{resources}/layout/custom_game/action_bar_ability.xml", false, false );
		abilityPanels[ i ] = abilityPanel;
		// slot.push( abilityPanel );
		abilityPanel.SetAbility( ability, queryUnit, Game.IsInAbilityLearnMode() );
	}
	// clear any remaining panels
	for (var i = abilityPanels.length; i < 7; i++ )
	{
		var abilityPanel = $.CreatePanel( "Panel", spellSlots, "" );
		abilityPanel.BLoadLayout( "file://{resources}/layout/custom_game/action_bar_ability.xml", false, false );
		abilityPanels[ i ] = abilityPanel;
	}
}

var spellListUp = false;
function ShowSpells() {
	$("#known-spells").SetHasClass( "is_active", !spellListUp );
	spellListUp = !spellListUp;
}

(function()
{
	GameEvents.Subscribe( "dota_portrait_ability_layout_changed", UpdateAbilityList );
	GameEvents.Subscribe( "dota_player_update_selected_unit", UpdateAbilityList );
	GameEvents.Subscribe( "dota_player_update_query_unit", UpdateAbilityList );
	GameEvents.Subscribe( "dota_ability_changed", UpdateAbilityList );
	GameEvents.Subscribe( "dota_hero_ability_points_changed", UpdateAbilityList );

	UpdateAbilityList();
})();

