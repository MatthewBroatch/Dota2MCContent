"use strict";

var knownSpells = [];
var abilityPanels = [];

function UpdateAbilityList()
{
	UpdateSpellListShown();
	var spellSlots = $( "#spell-slots-inner" );
	if ( !spellSlots )
		return;
	spellSlots.RemoveAndDeleteChildren();
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
		abilityPanels.push(abilityPanel);
		// slot.push( abilityPanel );
		abilityPanel.SetAbility( ability, queryUnit, Game.IsInAbilityLearnMode() );
	}
	// clear any remaining panels
	for (var i = abilityPanels.length; i < 6; i++ )
	{
		var abilityPanel = $.CreatePanel( "Panel", spellSlots, "" );
		abilityPanel.BLoadLayout( "file://{resources}/layout/custom_game/action_bar_ability.xml", false, false );
		abilityPanels.push(abilityPanel);
	}
}

var spellListUp = false;
function ShowSpells() {
	$("#known-spells").SetHasClass( "is_active", !spellListUp );
	spellListUp = !spellListUp;
}

function HeroLearnsSpell(event) {
	var alreadyKnowsSpell = false;
	for(var i = 0; i < knownSpells.length; i++)
		if(knownSpells[0] === event.SpellName)
			alreadyKnowsSpell = true;
	if(alreadyKnowsSpell)
		return;
	//TODO Popup
	knownSpells.push(event.SpellName);
	UpdateSpellList();
}

function UpdateSpellList() {
	var spellList = $( "#known-spells-inner" );
	if ( !spellList )
		return;
	spellList.RemoveAndDeleteChildren();

	for ( var i = 0; i < knownSpells.length; ++i )
	{
		// create a new panel
		var abilityPanel = $.CreatePanel( "Panel", spellList, "" );
		abilityPanel.BLoadLayout( "file://{resources}/layout/custom_game/known_spell.xml", false, false );
		abilityPanels.push(abilityPanel);
		// slot.push( abilityPanel );
		abilityPanel.SetAbility( knownSpells[i] );
	}
}

function UpdateSpellListShown() {
	var queryUnit = Players.GetLocalPlayerPortraitUnit();
	$.Msg(Entities.IsRealHero( queryUnit ));
	if( Entities.IsControllableByPlayer( queryUnit, Game.GetLocalPlayerID() ) && Entities.IsRealHero( queryUnit )) {
		$("#known-spells-button").SetHasClass( "is_hidden", false );
	} else {
		spellListUp = true;
		ShowSpells();
		$("#known-spells-button").SetHasClass( "is_hidden", true );
	}
}

(function()
{
	GameEvents.Subscribe( "dota_portrait_ability_layout_changed", UpdateAbilityList );
	GameEvents.Subscribe( "dota_player_update_selected_unit", UpdateAbilityList );
	GameEvents.Subscribe( "dota_player_update_query_unit", UpdateAbilityList );
	GameEvents.Subscribe( "dota_ability_changed", UpdateAbilityList );
	GameEvents.Subscribe( "dota_hero_ability_points_changed", UpdateAbilityList );
	GameEvents.Subscribe( "hero_learns_spell", HeroLearnsSpell);

	UpdateAbilityList();
})();
