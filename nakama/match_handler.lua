local nk = require("nakama")

local function match_init(context, params)
  local state = {
    players = {},
    match_id = context.match_id,
    label = "battle-royale",
    tick = 0,
    open = true,
  }
  return state
end

local function match_join(context, state, presences)
  for _, p in ipairs(presences) do
    state.players[p.user_id] = { x = 0, y = 50, z = 0, health = 100, kills = 0 }
    nk.logger_info(string.format("Player %s joined match %s", p.user_id, state.match_id))
  end
  state.open = #state.players < 10
  return state
end

local function match_leave(context, state, presences)
  for _, p in ipairs(presences) do
    state.players[p.user_id] = nil
    nk.logger_info(string.format("Player %s left match %s", p.user_id, state.match_id))
  end
  return state
end

local function match_loop(context, state, messages)
  state.tick = state.tick + 1
  for _, msg in ipairs(messages) do
    local decoded = nk.json_decode(msg.data)
    nk.logger_info(string.format("Tick %d: msg from %s", state.tick, msg.sender.user_id))
  end
  return state
end

local function match_terminate(context, state, presences)
  nk.logger_info(string.format("Match %s terminating", state.match_id))
end

nk.register_matchmaker_matched(function(context, matches)
  nk.logger_info(string.format("Matchmaker matched %d players", #matches))
end)

return {
  match_init = match_init,
  match_join = match_join,
  match_leave = match_leave,
  match_loop = match_loop,
  match_terminate = match_terminate,
}
