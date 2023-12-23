const listeners = new Map();

const EventBus = {
  on(event, callback) {
    var existingListeners = listeners.get(event) ?? [];
    var id = 0;
    if (!existingListeners) {
      listeners.set(event, []);
    } else {
      id = existingListeners[existingListeners.length].id;
    }

    listeners.set(event, [...(existingListeners), { id, callback }]);
    return id;
  },
  dispatch(event, data) {
    var existingListeners = listeners.get(event) ?? [];
    for (var listener of existingListeners) {
      listener.callback(data);
    }
  },
  remove(event, id) {
    var existingListeners = listeners.get(event) ?? [];
    if (existingListeners) {
      listeners.set(event, existingListeners.filter(x => x.id !== id));
    }

    if (existingListeners.length === 0) {
      listeners.delete(event);
    }
  },
};

export default EventBus;