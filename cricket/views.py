from django.shortcuts import render, get_object_or_404, redirect
from .models import Player, League, Match, Team, LiveScore, Location
from .forms import LiveScoreForm, updateInningForm
from django.http import JsonResponse
from django.db.models import Sum, Count
from django.core.exceptions import ObjectDoesNotExist


#Batting team players on manage_scores.html
def get_players(request):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' and request.method == 'GET':
        team_id = request.GET.get('team')
        if team_id:
            try:
                # Get IDs of players who are out from LiveScore model
                out_player_ids = LiveScore.objects.exclude(out_player=None).values_list('out_player_id', flat=True)

                # Fetch all players for the team
                players = Player.objects.filter(
                    teams__id=team_id
                )

                # Exclude players who are in the "out_players" column of the LiveScore model
                players = players.exclude(id__in=out_player_ids)

                player_data = {
                    player.id: f"{player.first_name} {player.last_name}"
                    for player in players
                }
                return JsonResponse(player_data)
            except Player.DoesNotExist:
                return JsonResponse({})
        else:
            return JsonResponse({})
    return JsonResponse({})



def get_live_scorecard_info(request, match_id):
    try:
        last_entry = LiveScore.objects.filter(match_id=match_id).order_by('-id').first()
        legel_balls = LiveScore.objects.filter(match_id=match_id, extras='no_extra')

        if last_entry and last_entry.strike:
            total_runs = LiveScore.objects.filter(
                match=last_entry.match,
                strike=last_entry.strike,
                extras='no_extra'
            ).aggregate(Sum('runs'))['runs__sum'] or 0

            batting_strike_player_info = {
                'player_name': f"{last_entry.strike.first_name} {last_entry.strike.last_name}",
                'total_runs': total_runs,
                'legal_balls_played': LiveScore.objects.filter(match=last_entry.match, strike=last_entry.strike, extras='no_extra').count(),
                'player_image': str(last_entry.strike.player_image.url)
            }

            batting_non_strike_player_info = {
                'player_name': f"{last_entry.non_strike.first_name} {last_entry.non_strike.last_name}",
                'total_runs': total_runs,
                'legal_balls_played': LiveScore.objects.filter(match=last_entry.match, non_strike=last_entry.non_strike, extras='no_extra').count(),
                'player_image': str(last_entry.non_strike.player_image.url)  # Assuming player_image is a FileField in your Player model
            }

            bowler_info = {
                'bowler_name': last_entry.bowler.first_name + ' ' + last_entry.bowler.last_name,
                'legal_balls': LiveScore.objects.filter(match_id=match_id, bowler=last_entry.bowler, ).exclude(extras__in=['wide', 'no_ball', 'bye', 'leg_bye', 'penalty_runs']).count(),
                'bowler_image_url': last_entry.bowler.player_image.url if last_entry.bowler.player_image else None
            }

            total_balls = legel_balls.count()
            total_over = total_balls // 6
            total_team_runs = LiveScore.objects.filter(match=last_entry.match, team=last_entry.team).aggregate(Sum('runs'))['runs__sum'] or 0
            legal_balls = LiveScore.objects.filter(match=last_entry.match, team=last_entry.team, extras='no_extra').count()
            wickets_fallen = LiveScore.objects.filter(match=last_entry.match, team=last_entry.team, wicket__in=['run_out', 'caught_out', 'bowled_out', 'leg_before_wicket', 'stumped_out', 'hit_wicket']).count()

            live_scores = LiveScore.objects.filter(match_id=match_id).order_by('id')
            # Extract over slots from the live scores
            over_slots = []

            for score in live_scores:
                # Logic to determine the content of each slot based on the LiveScore entry
                slot_content = determine_slot_content(score)
                over_slots.append(slot_content)

            
             # Get the wicket count and player names for the current bowler in the specific match
            wickets_info = LiveScore.objects.filter(match=last_entry.match, bowler=last_entry.bowler, wicket__in=['run_out', 'caught_out', 'bowled_out', 'leg_before_wicket', 'stumped_out', 'obstructing_the_field', 'hit_wicket', 'timed_out', 'hit_the_ball_twice']).values('out_player__first_name', 'out_player__last_name').distinct()

            # Count the wickets
            wicket_count = wickets_info.count()

            # Get the list of player names
            player_names = [f"{player['out_player__first_name']} {player['out_player__last_name']}" for player in wickets_info]

            runs_given = LiveScore.objects.filter(match=last_entry.match, bowler=last_entry.bowler, extras='no_extra').aggregate(Sum('runs'))['runs__sum'] or 0


            return JsonResponse({
                'strike_player_info': batting_strike_player_info,
                'non_strike_player_info': batting_non_strike_player_info, 
                'bowler_info': bowler_info, 
                'total_balls': total_balls,
                'total_over': total_over,
                'total_team_runs': total_team_runs,
                'legal_balls': legal_balls,
                'wickets_fallen': wickets_fallen,
                'over_slots': over_slots,
                'wicket_count': wicket_count,
                'player_names': player_names,
                'runs_given': runs_given
            })

        else:
            return JsonResponse({'error': 'No live scores found for the match or no batting strike player'}, status=404)
        


    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def determine_slot_content(score):
    if score.extras == 'wide':
        return '1WD'
    elif score.runs == 4:
        return '4'
    elif score.runs == 6:
        return '6'
    else:
        return str(score.runs)


def get_total_runs_and_legal_balls(request, match_id):
    try:
        last_entry = LiveScore.objects.filter(match_id=match_id).order_by('-id').first()

        if last_entry:
            total_runs = LiveScore.objects.filter(match=last_entry.match, team=last_entry.team).aggregate(Sum('runs'))['runs__sum'] or 0

            legal_balls = LiveScore.objects.filter(match=last_entry.match, team=last_entry.team, extras='no_extra').count()

            return JsonResponse({'total_runs': total_runs, 'legal_balls': legal_balls})

        else:
            return JsonResponse({'error': 'No live scores found for the match'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
    



#Live Score data for manage_scores.html
def get_live_scores_for_match(request, match_id):
    try:
        # Fetch the match to get the batting team
        match = get_object_or_404(Match, pk=match_id)
        batting_team = match.batting_team
        batting_team_id = match.batting_team_id
        batting_team_name = get_object_or_404(Team, pk=batting_team_id).name
        last_entry = LiveScore.objects.filter(match_id=match_id).order_by('-id').first()
        total_runs = LiveScore.objects.filter(match=last_entry.match, team=last_entry.team).aggregate(Sum('runs'))['runs__sum'] or 0


        # Fetch live scores for the specified match and batting team, ordered by id in descending order
        live_scores_for_match = LiveScore.objects.filter(match_id=match_id, team=batting_team).order_by('-id')

        # Serialize live scores data
        serialized_live_scores = []
        for live_score in live_scores_for_match:
            serialized_live_score = {
                'id': live_score.id,
                'runs': live_score.runs,
                'extras': live_score.extras,
                'wicket': live_score.wicket,
                'bowler': f"{live_score.bowler.first_name} {live_score.bowler.last_name}" if live_score.bowler else None,
                'bowler_id': f"{live_score.bowler_id}" if live_score.bowler else None,
                'strike_player_name': f"{live_score.strike.first_name} {live_score.strike.last_name}" if live_score.strike else None,
                'strike_player_id': f"{live_score.strike_id}" if live_score.strike else None,
                'non_strike_player_name': f"{live_score.non_strike.first_name} {live_score.non_strike.last_name}" if live_score.non_strike else None,
                'non_strike_player_id': f"{live_score.non_strike_id}" if live_score.non_strike else None,
                'wicket_out_player_name': f"{live_score.out_player.first_name} {live_score.out_player.last_name}" if live_score.out_player else None,
                'time': live_score.timestamp,
                'batting_team_name': batting_team_name,
                # Add other fields as needed
            }
            serialized_live_scores.append(serialized_live_score)


        # Return the live scores data as a JSON response
        return JsonResponse({
            'live_scores_for_match': serialized_live_scores,
            'total_runs': total_runs,

        })

    except Exception as e:
        # Handle exceptions and return an error response
        return JsonResponse({'error': str(e)}, status=500)
    




# Out player data manage_scores.html
def get_players_without_not_out(request, match_id):
    try:
        match = get_object_or_404(Match, pk=match_id)
        batting_team = match.batting_team

        all_out_player_id = LiveScore.objects.filter(match_id=match_id, team=batting_team, wicket__isnull=False).exclude(wicket='not_out').values_list('out_player_id', flat=True)

        out_player_ids = list(all_out_player_id)

        players = Player.objects.filter(id__in=out_player_ids).values('id', 'first_name', 'last_name')

        players_info = []
        for player in players:
            player_id = player['id']
            relevant_scores = LiveScore.objects.filter(
                strike_id=player_id,
                extras='no_extra'
            )

            player['runs'] = relevant_scores.aggregate(Sum('runs'))['runs__sum']
            
            latest_score = LiveScore.objects.filter(out_player_id=player_id).exclude(wicket__in=['not_out', 'retired_not_out']).order_by('-id').first()



            
            total_runs = relevant_scores.aggregate(Sum('runs'))['runs__sum'] or 0
            total_balls = relevant_scores.count()
            player['total_balls'] = total_balls

            strike_rate = (total_runs / total_balls) * 100 if total_balls > 0 else 0.0
            player['strike_rate'] = "{:.2f}".format(strike_rate)

            total_4s = relevant_scores.filter(runs=4).count()
            total_6s = relevant_scores.filter(runs=6).count()
            
            player['total_4s'] = total_4s
            player['total_6s'] = total_6s

            if latest_score and latest_score.bowler_id:
                bowler_name = Player.objects.filter(id=latest_score.bowler_id).values('first_name', 'last_name').first()
                if bowler_name:
                    player['bowler_name'] = f"{bowler_name['first_name']} {bowler_name['last_name']}"
                else:
                    player['bowler_name'] = None
            else:
                player['bowler_name'] = None

            
            if latest_score and latest_score.bowler_id:
                fielder_name = Player.objects.filter(id=latest_score.wicket_by_id).values('first_name', 'last_name').first()
                if fielder_name:
                    player['fielder_name'] = f"{fielder_name['first_name']} {fielder_name['last_name']}"
                else:
                    player['fielder_name'] = None
            else:
                player['fielder_name'] = None

            player['wicket'] = latest_score.wicket if latest_score else None
            player['wicket_at'] = latest_score.wicket_at if latest_score else None
            player['run_at'] = latest_score.run_at if latest_score else None
            players_info.append(player)

        # Sort players_info based on player IDs in ascending order
        players_info.sort(key=lambda x: x['id'])


        # Fetch extras from LiveScore model for the batting team
        extras = LiveScore.objects.filter(match_id=match_id, team=batting_team, extras__isnull=False).exclude(extras='no_extra').values('extras').annotate(count=Count('extras'))
        total_extras_count = extras.aggregate(total=Sum('count'))['total']
        extras_list = list(extras)


        # Get all players for the current batting team
        all_players = Player.objects.filter(team=batting_team).values('first_name', 'last_name')
        live_score_out_player_ids = LiveScore.objects.filter(match_id=match_id, team=batting_team, out_player__isnull=False).values_list('out_player', flat=True)
        players_not_out = all_players.exclude(id__in=live_score_out_player_ids)
        yet_to_bat = [{'first_name': player['first_name'], 'last_name': player['last_name']} for player in players_not_out]

        return JsonResponse({
            'players': players_info,
            'total_extras_count': total_extras_count,
            'extras': extras_list,
            'yet_to_bat': yet_to_bat,
            })
    except Exception as e:
        # Log the exception for debugging
        print(f"Error fetching players without 'not_out': {e}")
        return JsonResponse({'error': 'Internal Server Error'}, status=500)
    

#template view for players
def players_view(request):
    players = Player.objects.all()
    return render(request, 'cricket/players.html', {"players":players})

def player_detail(request, player_id):
    player = get_object_or_404(Player, id=player_id)
    return render(request, 'cricket/player_detail.html', {'player': player})

#template view for leagues
def leagues_view(request):
    leagues = League.objects.all()
    return render(request, 'leagues.html', {'leagues': leagues})


#template view for score updater on manage scores
def manage_scores(request, match_id):
    match = get_object_or_404(Match, pk=match_id)

    # Get the associated league for the match
    associated_league = League.objects.filter(matches__id=match_id).first()

    if request.method == 'POST':
        form = LiveScoreForm(request.POST)
        bowler_id = request.POST.get('bowler_id')

        if form.is_valid():
            live_score = form.save(commit=False)
            live_score.match = match

            team_id = request.POST.get('team')
            bowler_id = request.POST.get('bowler')
            strike_id = request.POST.get('strike')
            non_strike_id = request.POST.get('non_strike')
            out_player_id = request.POST.get('out_player_value')
            active_inning = request.POST.get('inning')
            batting_team = request.POST.get('batting_team')
            wicket_by = request.POST.get('wicket_by')
            wicket_at = request.POST.get('wicket_at')
            run_at = request.POST.get('run_at')
            over_run = request.POST.get('over_run')
            partner = request.POST.get('partner')
            partner_data = request.POST.get('partner_data')
            partner_data = request.POST.get('partner_data')
            last_inning_team = request.POST.get('last_inning_team')


            # Update bowler_id in the Match model
            match.bowler_id = bowler_id
            match.striker_id = strike_id
            match.non_striker_id = non_strike_id
            match.batting_team_id = batting_team
            match.inning = active_inning
            match.last_inning_team = last_inning_team
            match.save()

            live_score.bowler_id = bowler_id
            live_score.strike_id = strike_id
            live_score.non_strike_id = non_strike_id
            live_score.team_id = team_id
            live_score.out_player_id = out_player_id
            live_score.wicket_by_id = wicket_by
            live_score.wicket_at = wicket_at
            live_score.run_at = run_at
            live_score.over_run = over_run
            live_score.partner = partner
            live_score.partner_data = partner_data

            live_score.save()

            # You can add a message or any other action if needed
            # For example: messages.success(request, 'Live score added successfully')

            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    else:
        form = LiveScoreForm()

    return render(request, 'manage_scores.html', {'match': match, 'associated_league': associated_league, 'form': form})


#update inning update_inning.html
def update_inning(request, match_id):
    match = get_object_or_404(Match, pk=match_id)

    if request.method == 'POST':
        # Extract values from the request
        inning = request.POST.get('inning')
        striker_id = request.POST.get('strike')
        non_striker_id = request.POST.get('non_strike')
        bowler_id = request.POST.get('bowler')
        batting_team_id = request.POST.get('batting_team')

        # handle other custom fields similarly

        # Update the match model with the custom field values
        match.inning = inning
        match.striker_id = striker_id
        match.non_striker_id = non_striker_id
        match.bowler_id = bowler_id
        match.batting_team_id = batting_team_id

        # update other custom fields similarly

        # Save the changes to the match model
        match.save()


        return JsonResponse({'success': True})
    else:
        form = updateInningForm(instance=match)
        return render(request, 'update_inning.html', {'match': match, 'form': form})


#Batting Players stats on manage_scores.html
def get_admin_player_scoreboard(request, match_id):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' and request.method == 'GET':
        try:
            # Get the match object
            match = Match.objects.get(pk=match_id)
            
            # Get the player ID from the request data (assuming it's passed in the URL)
            player_id = request.GET.get('player_id')


            # Check if there is a batting team for the match
            if match.batting_team:
                # Get the specific player based on the player_id
                player = Player.objects.get(pk=player_id)

                # Get the associated live score data for the player in the specific match
                live_scores = LiveScore.objects.filter(match=match, strike=player)

                # Calculate total runs for the player in the specific match
                total_runs = live_scores.filter(extras='no_extra').aggregate(Sum('runs'))['runs__sum'] or 0

                # Calculate total balls played by the player in the specific match
                # total_balls = live_scores.count()
                total_balls = live_scores.filter(extras='no_extra').count()


                # Calculate total 4s and 6s for the player in the specific match
                total_4s = live_scores.filter(runs=4).count()
                total_6s = live_scores.filter(runs=6).count()

                # Get the player image URL
                player_image_url = player.player_image.url if player.player_image else None

                strike_rate = (total_runs / total_balls) * 100 if total_balls > 0 else 0.0


                # Create player scoreboard data
                player_data = {
                    'playerName': f"{player.first_name} {player.last_name}",
                    'totalRuns': total_runs,
                    'totalBalls': total_balls,
                    'total4s': total_4s,
                    'total6s': total_6s,
                    'strikeRate': "{:.2f}".format(strike_rate),
                    'playerImageURL': player_image_url,
                    # Add other fields as needed
                }

                # Return the data as a JSON response
                return JsonResponse({'player_scoreboard_data': [player_data]})

            else:
                return JsonResponse({'error': 'Batting team not assigned for the match'})

        except (Match.DoesNotExist, Player.DoesNotExist):
            return JsonResponse({'error': 'Match or player not found'})
    else:
        return JsonResponse({'error': 'Invalid request'})
    



#Batting Players stats on manage_scores.html
def batting_team_summary(request, match_id):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' and request.method == 'GET':
        try:
            match = Match.objects.get(pk=match_id)
            if match.batting_team:
                live_scores = LiveScore.objects.filter(match=match)
                total_runs = live_scores.aggregate(Sum('runs'))['runs__sum'] or 0


                # Create player scoreboard data
                player_data = {
                    'totalRuns': total_runs,
                }

                # Return the data as a JSON response
                return JsonResponse({'batting_team_summary_data': [player_data]})

            else:
                return JsonResponse({'error': 'Batting team not assigned for the match'})

        except (Match.DoesNotExist, Player.DoesNotExist):
            return JsonResponse({'error': 'Match or player not found'})
    else:
        return JsonResponse({'error': 'Invalid request'})
    




#Bowling Players stats on manage_scores.html
def get_bowler_admin_stats(request, match_id):
    try:
        # Get the bowler ID from the request data
        bowler_id = request.GET.get('bowler_id')

        if bowler_id is not None:
            try:
                # Try to get the player with the given ID
                bowler = Player.objects.get(id=bowler_id)

                # Get the number of legal balls delivered by the bowler (excluding specific extras)
                legal_balls = LiveScore.objects.filter(
                    match_id=match_id,
                    bowler=bowler,
                    extras='no_extra',
                ).count()

                # Calculate total overs based on the legal balls
                total_overs = round(legal_balls / 6, 1)
                # Separate the integer and fractional parts of total_overs
                integer_part = int(total_overs)
                fractional_part = round((total_overs - integer_part) * 6)  # Convert the fractional part to balls
                final_over = f"{integer_part}.{fractional_part}"


                # Get the total runs given by the bowler
                total_runs_given = LiveScore.objects.filter(
                    match_id=match_id,
                    bowler=bowler,
                ).aggregate(Sum('runs'))['runs__sum'] or 0


                # Get the number of wickets taken by the bowler
                wickets_taken = LiveScore.objects.filter(
                    match_id=match_id,
                    wicket_by=bowler,
                ).count()

                runs_entries = LiveScore.objects.filter(
                    match_id=match_id,
                    bowler=bowler,
                ).values('timestamp', 'runs').order_by('timestamp')

                runs_list = [{'timestamp': entry['timestamp'].isoformat(), 'runs': entry['runs']} for entry in runs_entries]
                

                bowler_info = {
                    'bowler_name': f"{bowler.first_name} {bowler.last_name}",
                    'legal_balls': legal_balls,
                    'overs': final_over,

                    'runs_given': total_runs_given,
                    'wickets_taken': wickets_taken,
                    'runs_entries': runs_list,
                    'bowler_image_url': bowler.player_image.url if bowler.player_image else None,
                }

                # Return the bowler's information as a JSON response
                return JsonResponse({'bowlers_info': [bowler_info]})

            except Player.DoesNotExist:
                # Handle the case when the player with the given ID does not exist
                return JsonResponse({'error': f"Player with ID {bowler_id} does not exist."}, status=404)
        else:
            return JsonResponse({'error': 'Bowler ID is not provided in the request'}, status=400)

    except Exception as e:
        # Print the traceback for debugging
        import traceback
        traceback.print_exc()

        # Return an error response
        return JsonResponse({'error': str(e)}, status=500)
    

#Team Identifier on manage_scores.html    
def get_teams(request):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' and request.method == 'GET':
        match_id = request.GET.get('match')
        if match_id:
            try:
                match = Match.objects.get(pk=match_id)
                team_data = {
                    'batting_team_id': match.batting_team.id,
                    'batting_team': match.batting_team.name if match.batting_team else '',
                    'toss_winner': match.toss_winner.name if match.toss_winner else '',
                    'toss_decision': match.toss_decision,
                    'team1': {'id': match.team1.id, 'name': match.team1.name},
                    'team2': {'id': match.team2.id, 'name': match.team2.name},
                }
                return JsonResponse(team_data)
            except Match.DoesNotExist:
                return JsonResponse({})
        else:
            return JsonResponse({})
    else:
        return JsonResponse({})

import logging

# Add this at the beginning of your views.py file
logger = logging.getLogger(__name__)

# Out player data manage_scores.html
def get_batting_team_stats(request, match_id):
    try:
        # Fetch the match to get the batting team
        match = get_object_or_404(Match, pk=match_id)
        batting_team = match.batting_team

        # Get IDs of players who are out from LiveScore model
        out_player_ids = LiveScore.objects.filter(match_id=match_id, team=batting_team, wicket__isnull=False).exclude(wicket='not_out').values_list('out_player_id', flat=True)

        # Fetch players who are not out based on the LiveScore entries
        players = Player.objects.filter(id__in=out_player_ids).values('id', 'first_name', 'last_name')

        # Fetch run and wicket information for each player
        players_info = []
        for player in players:
            player_id = player['id']
            # Filter LiveScore entries where extras is 'no_extra'
            relevant_scores = LiveScore.objects.filter(
                out_player_id=player_id,
                extras='no_extra'
            )
                                                
            # Sum runs from relevant scores
            player['runs'] = relevant_scores.aggregate(Sum('runs'))['runs__sum']
            # Get the wicket value from the latest LiveScore entry
            latest_score = LiveScore.objects.filter(out_player_id=player_id).exclude(wicket__in=['not_out', 'retired_not_out']).order_by('-id').first()
            total_runs = relevant_scores.aggregate(Sum('runs'))['runs__sum'] or 0
            total_balls = relevant_scores.count()
            player['total_balls'] = total_balls


            #Calculate strike rate
            strike_rate = (total_runs / total_balls) * 100 if total_balls > 0 else 0.0
            player['strike_rate'] = "{:.2f}".format(strike_rate)

            # Get the total number of 4s and 6s for the player
            total_4s = relevant_scores.filter(runs=4).count()
            total_6s = relevant_scores.filter(runs=6).count()
            
            player['total_4s'] = total_4s
            player['total_6s'] = total_6s

            player['wicket'] = latest_score.wicket if latest_score else None


            players_info.append(player)

        return JsonResponse({'players': players_info})
    except Exception as e:
        # Log the exception for debugging
        print(f"Error fetching players without 'not_out': {e}")
        return JsonResponse({'error': 'Internal Server Error'}, status=500)

#stat Page
def view_stats(request, match_id):
    match = get_object_or_404(Match, pk=match_id)
    match_date = match.date
    match_toss_decision = match.toss_decision
    match_toss_winner = match.toss_winner.name if match.toss_winner else None
    league_name = match.leagues.first().name if match.leagues.exists() else None
    umpires = match.umpire.all() if match.umpire.exists() else None
    league_format = match.leagues.first().match_format if match.leagues.exists() else None
    match_number = match.leagues.first().matches.filter(date__lte=match_date).count()
    match_location = match.location.name if match.location else None
    batting_team_players = match.batting_team.players.all() if match.batting_team else None
    # Determine the opponent team based on the batting team
    opponent_team = match.team2 if match.batting_team == match.team1 else match.team1

    opponent_team_players = opponent_team.players.all() if opponent_team else None

    upmires = [
        {'name': f"{umpire.first_name} {umpire.last_name}"} 
        for umpire in umpires
    ] if umpires else None

    return render(request, 'view_stats.html', {
        'match': match, 
        'league_name': league_name, 
        'league_format': league_format,
        'match_number': match_number,
        'match_location': match_location,
        'match_toss_winner': match_toss_winner,
        'match_toss_decision': match_toss_decision,
        'umpires': upmires,
        'batting_team_players': batting_team_players,
        'opponent_team_players': opponent_team_players,
    })


#stat Page
def get_bowlers(request):
    if request.META.get('HTTP_X_REQUESTED_WITH') == 'XMLHttpRequest' and request.method == 'GET':
        team_id = request.GET.get('team')
        if team_id:
            try:
                team = Team.objects.get(pk=team_id)
                bowlers = team.players.filter(bowling_style__isnull=False)
                bowler_data = {bowler.id: f"{bowler.first_name} {bowler.last_name}" for bowler in bowlers}
                return JsonResponse(bowler_data)
            except Team.DoesNotExist:
                return JsonResponse({})
        else:
            return JsonResponse({})
    else:
        return JsonResponse({})
        
   
#Stat Page



 


#bowler info manage_scores.html
def get_opponent_team_bowlers(request):
    if request.is_ajax() and request.method == 'GET':
        batting_team_id = request.GET.get('batting_team')

        # Fetch the opponent team's players
        opponent_team_players = Player.objects.exclude(teams=batting_team_id)

        # Prepare the data in a JSON-friendly format
        bowlers_data = [
            {'id': player.id, 'name': f"{player.first_name} {player.last_name}"}
            for player in opponent_team_players
        ]

        return JsonResponse({'bowlers': bowlers_data})

    return JsonResponse({})

#change bowler ID manage_scores.html
def update_bowler_id(request, match_id):
    # Your view logic here
    if request.method == 'POST':
        # Extract the bowler ID from the POST data
        bowler_id = request.POST.get('bowler_id')

        # Update the bowler ID for the match (replace this with your actual model logic)
        # Example: Assuming you have a Match model with a bowler field
        match = get_object_or_404(Match, pk=match_id)
        match.bowler = bowler_id
        match.save()

        # Return a JsonResponse indicating success (adjust the response as needed)
        return JsonResponse({'status': 'success', 'message': 'Bowler ID updated successfully'})

    # Return a JsonResponse indicating failure for non-POST requests
    return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

    















    
#Match info manage_scores.html
def current_match_info(request, match_id):
    try:
        # Get the current match based on the URL parameter (match_id)
        match = get_object_or_404(Match, pk=match_id)

        # Retrieve inning information
        inning = match.inning


        match.inning = 2
        match.save()

        # Pass match and inning information to the template context
        context = {'match': match, 'inning': inning}

        return JsonResponse(context)

    except Exception as e:
        # Handle exceptions and return an error response
        return JsonResponse({'error': str(e)}, status=500)
    







# Bowling Players stats on manage_scores.html
def get_bowler_stats(request, match_id):
    try:
        # Fetch all unique bowlers who have bowled in the match
        bowlers = LiveScore.objects.filter(match_id=match_id).values('bowler').distinct()
        bowlers_info = []

        for bowler_data in bowlers:
            bowler_id = bowler_data['bowler']
            try:
                # Try to get the bowler with the given ID
                bowler = Player.objects.get(id=bowler_id)

                # Get the number of legal balls delivered by the bowler (excluding specific extras)
                legal_balls = LiveScore.objects.filter(
                    match_id=match_id,
                    bowler=bowler,
                    extras='no_extra',
                ).count()

                # Calculate total overs based on the legal balls
                total_overs = round(legal_balls / 6, 1)
                # Separate the integer and fractional parts of total_overs
                integer_part = int(total_overs)
                fractional_part = round((total_overs - integer_part) * 6)  # Convert the fractional part to balls
                final_over = f"{integer_part}.{fractional_part}"

                # Get the total runs given by the bowler
                total_runs_given = LiveScore.objects.filter(
                    match_id=match_id,
                    bowler=bowler,
                ).aggregate(Sum('runs'))['runs__sum'] or 0

                # Get the number of wickets taken by the bowler
                wickets_taken = LiveScore.objects.filter(
                    match_id=match_id,
                    wicket_by=bowler,
                ).count()

                runs_entries = LiveScore.objects.filter(
                    match_id=match_id,
                    bowler=bowler,
                ).values('timestamp', 'runs').order_by('timestamp')

                runs_list = [{'timestamp': entry['timestamp'].isoformat(), 'runs': entry['runs']} for entry in runs_entries]

                bowler_info = {
                    'bowler_id': bowler_id,
                    'bowler_name': f"{bowler.first_name} {bowler.last_name}",
                    'legal_balls': legal_balls,
                    'overs': final_over,
                    'runs_given': total_runs_given,
                    'wickets_taken': wickets_taken,
                    'runs_entries': runs_list,
                    'bowler_image_url': bowler.player_image.url if bowler.player_image else None,
                }

                bowlers_info.append(bowler_info)

            except Player.DoesNotExist:
                # Handle the case when the bowler with the given ID does not exist
                return JsonResponse({'error': f"Bowler with ID {bowler_id} does not exist."}, status=404)

        # Return the information for all bowlers as a JSON response
        return JsonResponse({'bowlers_info': bowlers_info})

    except Exception as e:
        # Print the traceback for debugging
        import traceback
        traceback.print_exc()

        # Return an error response
        return JsonResponse({'error': str(e)}, status=500)

    



#partnership data
def get_player_partnership(request, match_id):
    try:
        # Fetch the match to get the batting team
        match = get_object_or_404(Match, pk=match_id)
        batting_team = match.batting_team


        # Get IDs of players who are out from LiveScore model
        all_out_player_id = LiveScore.objects.filter(match_id=match_id, team=batting_team, wicket__isnull=False).exclude(wicket='not_out').values_list('out_player_id', flat=True)

        # Include striker and non-striker IDs in the list of player IDs
        out_player_ids = list(all_out_player_id)

        # Fetch players who are not out based on the LiveScore entries
        players = Player.objects.filter(id__in=out_player_ids).values('id', 'first_name', 'last_name')

        # Fetch run and wicket information for each player
        players_info = []
        for player in players:
            player_id = player['id']
            # Filter LiveScore entries where extras is 'no_extra'
            relevant_scores = LiveScore.objects.filter(
                strike_id=player_id,
                extras='no_extra'
            )

            # Sum runs from relevant scores
            player['runs'] = relevant_scores.aggregate(Sum('runs'))['runs__sum']
            
            # Get the wicket value from the latest LiveScore entry
            latest_score = LiveScore.objects.filter(out_player_id=player_id).order_by('-id').first()

            total_balls = relevant_scores.count()
            player['total_balls'] = total_balls



            # Add bowler ID to player information
            if latest_score and latest_score.partner:
                # Get the name of the bowler from the Player table
                partner = Player.objects.filter(id=latest_score.partner).values('first_name', 'last_name').first()
                if partner:
                    player['partner'] = f"{partner['first_name']} {partner['last_name']}"
                else:
                    player['partner'] = None
            else:
                player['partner'] = None

            player['partner_data'] = latest_score.partner_data if latest_score else None
            

            players_info.append(player)

        # Sort players_info based on player IDs in ascending order
        players_info.sort(key=lambda x: x['id'])

        return JsonResponse({'players': players_info})
    except Exception as e:
        # Log the exception for debugging
        print(f"Error fetching players without 'not_out': {e}")
        return JsonResponse({'error': 'Internal Server Error'}, status=500)
    

#team template
    
from django.db.models import Q 
from datetime import datetime

def team_list(request):
    teams = Team.objects.all()
    return render(request, 'team.html', {'teams': teams})

def team_detail(request, team_id):
    team = get_object_or_404(Team, pk=team_id)
    team_matches = Match.objects.filter(Q(team1=team) | Q(team2=team))
    team_leagues = League.objects.filter(matches__in=team_matches).distinct()
    team_locations = Location.objects.filter(match__in=team_matches).distinct()

    return render(request, 'team_detail.html', {'team': team, 'team_matches': team_matches, 'team_leagues': team_leagues, 'team_locations': team_locations})


def players_page(request, team_id):
    team = get_object_or_404(Team, pk=team_id)
    players = team.players_of_team.all()

    # Add the current date and time to the template context
    now = datetime.now()

    return render(request, 'team_players.html', {'team': team, 'players': players, 'now': now})