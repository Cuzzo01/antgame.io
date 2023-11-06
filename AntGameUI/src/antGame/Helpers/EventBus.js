const listeners = new Map();

const EventBus = {
  on(event, callback) {
    var existingListeners = listeners.get(event);
    var id = 0;
    if (!existingListeners) {
      listeners.set(event, []);
    } else {
      id = existingListeners[existingListeners.length].id;
    }

    listeners.set(event, [...(listeners.get(event) ?? []), { id, callback }]);
    return id;
  },
  dispatch(event, data) {
    for (var listener of listeners.get(event)) {
      listener.callback(data);
    }
  },
  remove(event, id) {
    var existingListeners = listeners.get(event);
    if (existingListeners) {
      listeners.set(event, existingListeners.filter(x => x.id !== id));
    }

    if (listeners.get(event).length === 0) {
      listeners.delete(event);
    }
  },
};

export default EventBus;