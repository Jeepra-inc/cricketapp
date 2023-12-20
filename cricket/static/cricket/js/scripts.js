var form = $('#liveScoreForm');

//logic for wicket button clicks
$(".wicket-box").click(function () {
    $(".wicket-handler").toggleClass("d-none mb-3 wk-active");
    $(".form-footer").toggleClass("d-flex");
    $(".formSubmit").toggleClass("col-8")
});



//Conditional check if selected wicket type is run out or cought on the basis of this show strike changer button 
checkWicketStatus();

$("input[name='wicket']").click(function() {
    checkWicketStatus();
});

function checkWicketStatus() {
    if ($("#id_wicket_2").is(":checked") || $("#id_wicket_4").is(":checked")) {
        $("#strikeChanger").show();
    } else {
        $("#strikeChanger").hide();
    }
}

//Toogle between strike and non striker
function toggleSelectedValues() {
    var strikeValue = $("#strikeDropdown").val();
    var nonStrikeValue = $("#nonstrikeDropdown").val();

    $("#strikeDropdown").val(nonStrikeValue).trigger("change");
    $("#nonstrikeDropdown").val(strikeValue).trigger("change");
}

$("#strikeChanger").click(function() {
    var confirmation = confirm("Are you sure you want to change the strike player?");
    if (confirmation) {
        toggleSelectedValues();
    }
});




//Show warning to select different bowler
$('#id_bowler').change(function () {
    var selectedBowler = $(this).val();
    var currentBowler = localStorage.getItem('currentBowler');

    if (selectedBowler === currentBowler) {
        $(this).val(currentBowler);
        $('<div class="alert alert-warning py-1 px-3 bowler-notice">Please Change the Bowler</div>').insertBefore('.bowling-player-stats');
                        $('#id_bowler').next().find('.select2-selection--single').addClass('selectFocusChange');
    } else {
        $('#submitScoreButton').prop('disabled', false);
        $('#id_bowler').next().find('.select2-selection--single').removeClass('selectFocusChange');
        $('.bowler-notice').remove();
    }
});



// Function to fetch and populate the selected strike and non strike players to out selection dropdown
function fetchAndPopulateSelectedPlayersDropdown() {
    setTimeout(function () {
        // Get the current values of strike and non-strike dropdowns
        var selectedStrikeId = $('#strikeDropdown').val();
        var selectedNonStrikeId = $('#nonstrikeDropdown').val();

        // Fetch corresponding player names based on player IDs
        var selectedStrikeName = $('#strikeDropdown option:selected').text();
        var selectedNonStrikeName = $('#nonstrikeDropdown option:selected').text();

        // Create an array to hold the selected players
        var selectedPlayers = [];

        // Add the selected players to the array if they are not empty
        if (selectedStrikeId) {
            selectedPlayers.push({
                id: selectedStrikeId,
                name: selectedStrikeName
            });
        }

        if (selectedNonStrikeId) {
            selectedPlayers.push({
                id: selectedNonStrikeId,
                name: selectedNonStrikeName
            });
        }

        // Populate the selected players dropdown
        var selectedPlayersDropdown = $('#id_out_player');
        selectedPlayersDropdown.empty();

        // Add a default option
        selectedPlayersDropdown.append($('<option>', {
            value: '',
            text: 'Select Player'
        }));

        // Populate selected players from the array
        for (var i = 0; i < selectedPlayers.length; i++) {
            selectedPlayersDropdown.append($('<option>', {
                value: selectedPlayers[i].id,
                text: selectedPlayers[i].name
            }));
        }

        //HIDE strike players from out player select options
        $("#additionalDropdown option").prop('disabled', false);
        var outPlayerOptions = $("#id_out_player option");
        outPlayerOptions.each(function() {
            var valueToHide = $(this).val();
            $("#additionalDropdown option[value='" + valueToHide + "']").prop('disabled', true);
        });
        $("#additionalDropdown").trigger('change.select2');


        }, 100);
}

$('#strikeDropdown, #nonstrikeDropdown').change(function () {
    fetchAndPopulateSelectedPlayersDropdown();
});


var selectedPlayersValue = '';
$('#id_out_player').change(function () {
    selectedPlayersValue = $(this).val();
});
// Event listener for the "Additional Field" dropdown change event
$('#additionalDropdown').change(function () {
    var additionalFieldValue = $(this).val();
    if ($('#strikeDropdown').val() === selectedPlayersValue) {
        $('#strikeDropdown').val(additionalFieldValue).trigger('change');
    } else if ($('#nonstrikeDropdown').val() === selectedPlayersValue) {
        $('#nonstrikeDropdown').val(additionalFieldValue).trigger('change');
    }
});












function changeBowler(){
    var selectedBowler = $('#id_bowler').val();
    localStorage.setItem('currentBowler', selectedBowler);
}

// Off players after selection
$("#strikeDropdown").on('change.select2', function (e) {
    var selectedValue = $(this).val();
    $("#nonstrikeDropdown").find('option').prop('disabled', false);
    if (selectedValue !== "") {
        $("#nonstrikeDropdown").find('option[value="' + selectedValue + '"]').prop('disabled', true);
    }        

});

$("#nonstrikeDropdown").on('change.select2', function (e) {
    var selectedValue = $(this).val();
    $("#strikeDropdown").find('option').prop('disabled', false);
    if (selectedValue !== "") {
        $("#strikeDropdown").find('option[value="' + selectedValue + '"]').prop('disabled', true);
    }
});



$("#id_out_player").on('change.select2', function (e) {
    var outPlayerValue = $(this).val();
    var outType = $('input[name="wicket"]:checked').val();
    if (outType !== 'not_out' && outType !== 'retired_not_out') {
        form.attr('data-out', outPlayerValue);
    } else {
        form.attr('data-out', '');
    }
});

setTimeout(function() {
    var striker = $('#strikeDropdown').val();
    var nonStriker = $('#nonstrikeDropdown').val();
    form.attr('data-striker', striker);
    form.attr('data-nonstriker', nonStriker);
}, 500);



$("#id_out_player").on('change.select2', function (e) {
    var outPlayerValue = $(this).val();
    var outType = $('input[name="wicket"]:checked').val();
    if (outType !== 'not_out') {
        form.attr('data-out', outPlayerValue);
    } else {
        form.attr('data-out', '');
    }
});

setTimeout(function () {        
    var selectedValue = $('#strikeDropdown').val();
    var selectednonValue = $('#nonstrikeDropdown').val();
    $("#nonstrikeDropdown, #strikeDropdown").find('option').prop('disabled', false);
    if (selectedValue !== "") {
        $("#nonstrikeDropdown").find('option[value="' + selectedValue + '"]').prop('disabled', true);
    }
    if (selectednonValue !== "") {
        $("#strikeDropdown").find('option[value="' + selectednonValue + '"]').prop('disabled', true);
    }
}, 300);





function changeStrike() {
    $('#strikeDropdown').val(localStorage.getItem('strikePlayer')).trigger('change.select2');
    $('#nonstrikeDropdown').val(localStorage.getItem('nonStrikePlayer')).trigger('change.select2');
}

function changeStrikeOposite() {
    $('#strikeDropdown').val(localStorage.getItem('nonStrikePlayer')).trigger('change.select2');
    $('#nonstrikeDropdown').val(localStorage.getItem('strikePlayer')).trigger('change.select2');
}


setTimeout(function() {
        changeStrike();
    // Check if strike and non-strike players are already in localStorage
    // if (!localStorage.getItem('strikePlayer') || !localStorage.getItem('nonStrikePlayer')) {
        localStorage.setItem('strikePlayer', $('#strikeDropdown').val());
        localStorage.setItem('nonStrikePlayer', $('#nonstrikeDropdown').val());
        localStorage.setItem('currentBowler', $('#id_bowler').val());
    // }
}, 500);





$('input[name="wicket"]').change(function() {
    // Toggle the d-none class based on the selected value
    $(".out_player-wrapper").toggleClass("d-none", $(this).val() === 'not_out');
});

// Trigger the change event on page load to handle the initial state
$('input[name="wicket"]:checked').change();




// setTimeout(function() {
// var selectedValue = $("#additionalDropdown").val();
    
//     // Remove the selected value from id_out_player
//     $("#id_out_player option[value='" + selectedValue + "']").remove();

// }, 1000);


// function selectedPlayerRemover() {
//     var outPlayerOptions = $("#id_out_player option");
    
//     // Disable options in additionalDropdown that match the options in id_out_player
//     outPlayerOptions.each(function() {
//         var valueToHide = $(this).val();
//         $("#additionalDropdown option[value='" + valueToHide + "']").prop('disabled', true);
//     });

//     // Trigger change event on additionalDropdown to reflect the changes
//     $("#additionalDropdown").trigger('change.select2');
// }

// setTimeout(function() {
//     selectedPlayerRemover(); 
// }, 500);


// $("#strikeDropdown").change(function () {  
//     selectedPlayerRemover(); 
// });



$("input[name='wicket']").on('change', function() {
    if ($(this).val() === "retired_not_out") {
        $(".whoIsOutLabel").text("Who is retired?");
    } else {
        $(".whoIsOutLabel").text("Who is out?");
    }
});