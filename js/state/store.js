class Store {
  constructor() {
    this.state = {
      user: null,
      isAdmin: false,
      services: [],
      filteredServices: [],
      selectedService: null,
      availableSlots: [],
      userBookings: [],
      currentCategory: 'all',
      loading: false,
      error: null
    };
    
    this.listeners = [];
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  // User methods
  setUser(user) {
    this.setState({ user });
  }

  setAdmin(isAdmin) {
    this.setState({ isAdmin });
  }

  logout() {
    this.setState({
      user: null,
      isAdmin: false,
      selectedService: null,
      userBookings: []
    });
  }

  // Services methods
  setServices(services) {
    this.setState({ 
      services,
      filteredServices: services
    });
  }

  filterServices(category) {
    const filtered = category === 'all' 
      ? this.state.services
      : this.state.services.filter(s => s.category === category);
    
    this.setState({ 
      filteredServices: filtered,
      currentCategory: category
    });
  }

  selectService(service) {
    this.setState({ selectedService: service });
  }

  // Booking methods
  setAvailableSlots(slots) {
    this.setState({ availableSlots: slots });
  }

  setUserBookings(bookings) {
    this.setState({ userBookings: bookings });
  }

  addBooking(booking) {
    this.setState({
      userBookings: [...this.state.userBookings, booking]
    });
  }

  removeBooking(bookingId) {
    this.setState({
      userBookings: this.state.userBookings.filter(b => b.id !== bookingId)
    });
  }

  // UI state methods
  setLoading(loading) {
    this.setState({ loading });
  }

  setError(error) {
    this.setState({ error });
    if (error) {
      setTimeout(() => this.setState({ error: null }), 5000);
    }
  }
}

const store = new Store();
export default store;