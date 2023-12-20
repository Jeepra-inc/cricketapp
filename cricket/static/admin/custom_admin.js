
(function ($) {
    $(document).ready(function () {
        function updateBowlerDropdown() {
            // Get the selected batting team value
            var selectedBattingTeam = $('#id_batting_team').val();

            // Make an AJAX request to fetch the bowlers of the opponent team
            $.ajax({
                url: '/cricket/get_opponent_team_bowlers/',
                data: { 'batting_team': selectedBattingTeam },
                success: function (data) {
                    // Update the options in the bowler dropdown
                    var bowlerDropdown = $('#id_bowler');
                    bowlerDropdown.empty();
                    $.each(data.bowlers, function (key, bowler) {
                        bowlerDropdown.append($('<option></option>').attr('value', bowler.id).text(bowler.name));
                    });
                },
                error: function (error) {
                    console.error('Error fetching opponent team bowlers:', error);
                }
            });
        }

        // Call the function when the page loads and when the batting team selection changes
        updateBowlerDropdown();
        $('#id_batting_team').change(updateBowlerDropdown);
    });
})(django.jQuery);
