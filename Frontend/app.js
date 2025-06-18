const { createApp, ref, computed } = Vue;
            
            createApp({

            setup() {
                console.log('app.js loaded');
                const showLogin = ref(true);
                const showRegister = ref(false);
                // --- ZMIENNE STERUJĄCE WIDOKIEM ---
                const showApp = ref(false);      // Pokazuje panel rezerwacji
                const showCheck = ref(false);    // Pokazuje panel sprawdzania rezerwacji

                // --- ZMIENNE DO SPRAWDZANIA REZERWACJI ---
                const checkDate = ref('');           // Kod rezerwacji wpisany przez użytkownika
                const foundReservation = ref(null);  // Znaleziona rezerwacja po kodzie

                // --- ZMIENNE DOTYCZĄCE DATY I MIESIĄCA ---
                const currentYear = ref(new Date().getFullYear());
                const currentMonth = ref(new Date().getMonth()); // 0-11
                const monthNames = [
                    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
                ];
                const currentMonthName = computed(() => monthNames[currentMonth.value]);

                // --- GENEROWANIE DAT W MIESIĄCU ---
                const dates = ref([]);
                function getDaysInMonth(year, month) {
                    return new Date(year, month + 1, 0).getDate();
                }
                function generateDates() {
                    const days = getDaysInMonth(currentYear.value, currentMonth.value);
                    dates.value = Array.from({ length: days }, (_, i) => {
                        const date = new Date(currentYear.value, currentMonth.value, i + 1);
                        const dayOfWeek = date.toLocaleDateString('pl-PL', { weekday: 'long' });
                        return {
                            day: i + 1,
                            dayOfWeek: dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1),
                            year: currentYear.value,
                            month: currentMonthName.value
                        };
                    });
                }
                generateDates();

                // --- PAGINACJA DAT I GODZIN ---
                const currentPage = ref(0);           // Aktualna strona dat
                const itemsPerPage = ref(window.innerWidth < 900 ? 3 : 5); // Liczba dat na stronę (responsywność)
                const currentPageHours = ref(0);      // Aktualna strona godzin
                const itemsPerPageHours = ref(window.innerWidth < 900 ? 3 : 5); // Liczba godzin na stronę (responsywność)

                // --- REAKCJA NA ZMIANĘ ROZMIARU OKNA (responsywność) ---
                window.addEventListener('resize', () => {
                    itemsPerPage.value = window.innerWidth < 900 ? 3 : 5;
                    itemsPerPageHours.value = window.innerWidth < 900 ? 3 : 5;
                });

                // --- WYBÓR DATY I GODZINY ---
                const selectedDateIndex = ref(null);  // Wybrana data (indeks)
                const selectedHourIndex = ref(null);  // Wybrana godzina (indeks)
                const showContainer2 = ref(false);    // Pokazuje wybór godziny
                const selectedDate = computed(() =>
                    selectedDateIndex.value !== null ? visibleDates.value[selectedDateIndex.value] : null
                );
                const selectedHour = computed(() =>
                    selectedHourIndex.value !== null ? visibleHours.value[selectedHourIndex.value] : null
                );
                // --- GODZINY DOSTĘPNE W DANYM DNIU ---
                const hours = ref([]);

                // --- OBLICZANIE WIDOCZNYCH DAT I GODZIN (PAGINACJA) ---
                const visibleDates = computed(() => {
                    const start = currentPage.value * itemsPerPage.value;
                    return dates.value.slice(start, start + itemsPerPage.value);
                });
                const visibleHours = computed(() => {
                    const start = currentPageHours.value * itemsPerPageHours.value;
                    return hours.value.slice(start, start + itemsPerPageHours.value);
                });

                // --- FUNKCJE ZMIANY STRON DAT I GODZIN ---
                function nextPage() {
                    if ((currentPage.value + 1) * itemsPerPage.value < dates.value.length) {
                        currentPage.value++;
                    } else {
                        // Przejdź do następnego miesiąca
                        if (currentMonth.value === 11) {
                            currentMonth.value = 0;
                            currentYear.value++;
                        } else {
                            currentMonth.value++;
                        }
                        generateDates();
                        currentPage.value = 0;
                    }
                }
                function prevPage() {
                    if (currentPage.value > 0) {
                        currentPage.value--;
                    } else {
                        // Przejdź do poprzedniego miesiąca
                        if (currentMonth.value === 0) {
                            currentMonth.value = 11;
                            currentYear.value--;
                        } else {
                            currentMonth.value--;
                        }
                        generateDates();
                        currentPage.value = Math.floor((dates.value.length - 1) / itemsPerPage.value);
                    }
                }
                function nextPageHours() {
                    if ((currentPageHours.value + 1) * itemsPerPageHours.value < hours.value.length) {
                        currentPageHours.value++;
                    }
                }
                function prevPageHours() {
                    if (currentPageHours.value > 0) {
                        currentPageHours.value--;
                    }
                }

                // --- WYBÓR DATY I GODZINY ---
                function SelectHour(event, index) {
                    console.log('Przed rezerwacją:', showContainer2.value, selectedDateIndex.value, selectedHourIndex.value);
                    selectedDateIndex.value = index;
                    showContainer2.value = true;
                    currentPageHours.value = 0;
                    const dayOfWeek = event.target.innerText.split('\n')[0].trim().toLowerCase();
                    if (dayOfWeek.startsWith('niedziela')) {
                        hours.value = [];
                    } else if (dayOfWeek.startsWith('sobota')) {
                        hours.value = [8, 9, 10, 11, 12, 13, 14];
                    } else {
                        hours.value = [7, 8, 9, 10, 11, 12, 13, 14, 15];
                    }
                    selectedHourIndex.value = null; // reset wyboru godziny przy zmianie daty
                }

                // --- REZERWACJE I BLOKOWANIE GODZIN ---
                const bookedHours = ref([]);
                const reservations = ref([]);
                const sessionReservations = ref([]); // Rezerwacje z bieżącej sesji (do wyświetlania)

                // --- FORMULARZ REZERWACJI ---
                const imie = ref('');
                const nazwisko = ref('');
                const telefon = ref('');
                const email = ref('');

                // --- WALIDACJA FORMULARZA ---
                const isEmailValid = computed(() =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)
                );
                const isTelefonValid = computed(() =>
                    /^[0-9]{9}$/.test(telefon.value)
                );
                const isFormValid = computed(() =>
                    imie.value.trim() !== '' &&
                    nazwisko.value.trim() !== '' &&
                    isTelefonValid.value &&
                    isEmailValid.value
                );

                // --- GENEROWANIE UNIKALNEGO KODU REZERWACJI ---
                function generateUniqueCode() {
                    let code;
                    do {
                        code = Math.floor(100000 + Math.random() * 900000).toString();
                    } while (reservations.value.some(r => r.code === code));
                    return code;
                }

                // --- SPRAWDZANIE, CZY GODZINA JEST ZAJĘTA ---
                function isHourBooked(date, hour) {
                    if (!date) return false;
                    const dateStr = `${date.year}-${currentMonth.value + 1}-${date.day}`;
                    return bookedHours.value.some(
                        b => b.date === dateStr && b.hour === hour
                    );
                }
                async function fetchBookedHours() {
                    const response = await fetch('http://localhost:3000/api/booked');
                    if (response.ok) {
                        bookedHours.value = await response.json();
                        console.log('bookedHours:', bookedHours.value);
                    }
                }
                // --- ZAPISYWANIE REZERWACJI ---
                    async function SaveReservation() {
                        console.log('Przed rezerwacją:', showContainer2.value, selectedDateIndex.value, selectedHourIndex.value);
                        if (selectedDateIndex.value === null || selectedHourIndex.value === null) {
                            alert('Wybierz datę i godzinę!');
                            return;
                        }
                        if (!isFormValid.value) {
                            alert('Uzupełnij poprawnie wszystkie pola formularza!');
                            return;
                        }
                        const selectedDate = visibleDates.value[selectedDateIndex.value];
                        const selectedHour = visibleHours.value[selectedHourIndex.value];

                        const code = generateUniqueCode();
                        const reservation = {
                            code,
                            imie: imie.value,
                            nazwisko: nazwisko.value,
                            date: {
                                dayOfWeek: selectedDate.dayOfWeek,
                                month: currentMonth.value + 1,
                                day: selectedDate.day,
                                year: selectedDate.year,
                                hour: selectedHour
                            },
                            dateString: `${selectedDate.year}-${currentMonth.value + 1}-${selectedDate.day}`
                        };

                        const response = await fetch('http://localhost:3000/api/reservations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(reservation)
                        });

                         if (response.ok) {
                            sessionReservations.value.push(reservation);
                            await fetchBookedHours();
                            showContainer2.value = true;
                             console.log('Po rezerwacji:', showContainer2.value, selectedDateIndex.value, selectedHourIndex.value);
                        } else {
                            alert('Błąd przy zapisie rezerwacji');
                        }
                    }
                    
                

                // --- SPRAWDZANIE REZERWACJI PO KODZIE ---
                async function checkAvailability() {
                    const code = checkDate.value.trim();
                    if (!code) {
                        foundReservation.value = null;
                        return;
                    }
                    const response = await fetch(`http://localhost:3000/api/reservations/${code}`);
                    if (response.ok) {
                        foundReservation.value = await response.json();
                    } else {
                        foundReservation.value = null;
                    }
                }

                // --- ANULOWANIE REZERWACJI ---
                async function cancelReservation() {
                    if (!foundReservation.value) return;
                    const code = foundReservation.value.code;
                    const response = await fetch(`http://localhost:3000/api/reservations/${code}`, {
                        method: 'DELETE'
                    });
                    if (response.ok) {
                        checkDate.value = 'anulowano';
                        foundReservation.value = null;
                        await fetchBookedHours();
                    } else {
                        alert('Błąd przy anulowaniu rezerwacji');
                    }
                }
                
                const loginEmail = ref('');
                const loginPassword = ref('');
                const loginError = ref('');

                const registerName = ref('');
                const registerSurname = ref('');
                const registerEmail = ref('');
                const registerPassword = ref('');
                const registerPasswordRepeat = ref('');
                const registerError = ref('');

                // --- WALIDACJA REJESTRACJI ---
                const isNameValid = computed(() => registerName.value.trim().length >= 3);
                const isSurnameValid = computed(() => registerSurname.value.trim().length >= 3);
                
                const isPasswordValid = computed(() =>
                    registerPassword.value.length >= 8 &&
                    /[A-Za-z]/.test(registerPassword.value) && // przynajmniej jedna litera
                    /\d/.test(registerPassword.value) &&       // przynajmniej jedna cyfra
                    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(registerPassword.value) // znak specjalny
                );
                const isPasswordRepeatValid = computed(() =>
                    registerPassword.value === registerPasswordRepeat.value && registerPasswordRepeat.value.length > 0
                );

                const isRegisterFormValid = computed(() =>
                    isNameValid.value &&
                    isSurnameValid.value &&
                    isRegisterEmailValid.value &&
                    isPasswordValid.value &&
                    isPasswordRepeatValid.value
                );

                // --- WALIDACJA LOGOWANIA ---
                const isLoginEmailValid = computed(() =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail.value)
                );
                const isLoginPasswordValid = computed(() => loginPassword.value.length >= 8);
                const isRegisterEmailValid = computed(() =>
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerEmail.value)
                );
                // --- FUNKCJA REJESTRACJI ---
                async function register() {
                    console.log('Przechodzę do fetch rejestracji');
                    console.log('Kliknięto Zarejestruj');
                    registerError.value = '';
                    if (!isRegisterFormValid.value) {
                        if (!isNameValid.value) registerError.value = 'Imię musi mieć co najmniej 3 znaki.';
                        else if (!isSurnameValid.value) registerError.value = 'Nazwisko musi mieć co najmniej 3 znaki.';
                        else if (!isRegisterEmailValid.value) registerError.value = 'Nieprawidłowy adres email.';
                        else if (!isPasswordValid.value) registerError.value = 'Hasło musi mieć min. 8 znaków, zawierać literę, cyfrę i znak specjalny.';
                        else if (!isPasswordRepeatValid.value) registerError.value = 'Hasła nie są zgodne.';
                        return;
                    }
                    try {
                    const response = await fetch('http://localhost:3000/api/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: registerName.value,
                            surname: registerSurname.value,
                            email: registerEmail.value,
                            password: registerPassword.value
                        })
                    });
                    const data = await response.json();
                    if (!response.ok) {
                        registerError.value = data.error || 'Błąd rejestracji.';
                    } else {
                        alert('Rejestracja zakończona sukcesem! Możesz się zalogować.');
                        showRegister.value = false;
                        showLogin.value = true;
                    }
                } catch (err) {
                    registerError.value = 'Błąd połączenia z serwerem.';
                }
                }

                // --- FUNKCJA LOGOWANIA ---
                async function login() {
                    loginError.value = '';
                    if (!isLoginEmailValid.value) {
                        loginError.value = 'Nieprawidłowy adres email.';
                        return;
                    }
                    if (!isLoginPasswordValid.value) {
                        loginError.value = 'Hasło musi mieć co najmniej 8 znaków.';
                        return;
                    }
                    try {
                       
                        const response = await fetch('http://localhost:3000/api/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                email: loginEmail.value,
                                password: loginPassword.value
                            })
                        });
                        const data = await response.json();
                        if (!response.ok) {
                            loginError.value = data.error || 'Błędny email lub hasło.';
                        } else {
                            alert('Zalogowano pomyślnie!');
                            // tutaj możesz np. ustawić token, schować panel logowania itp.
                            showLogin.value = false;
                            // showMainApp.value = true; // jeśli masz taki widok
                        }
                    } catch (err) {
                        loginError.value = 'Błąd połączenia z serwerem.';
                    }
                    alert('Logowanie OK (tu dodaj wysyłkę do API)');
                }
                if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('sw.js');
                });
                }
                 fetchBookedHours();
                // --- ZWRACANE ZMIENNE I FUNKCJE DO TEMPLATE ---
                return {
                    // Widoki
                    showApp, showCheck,
                    // Daty i miesiące
                    currentYear, currentMonthName, visibleDates, nextPage, prevPage, generateDates, getDaysInMonth,
                    // Godziny
                    showContainer2, hours, visibleHours, nextPageHours, prevPageHours,
                    // Wybór
                    selectedDateIndex, selectedHourIndex, SelectHour,
                    // Formularz
                    imie, nazwisko, telefon, email, isEmailValid, isTelefonValid, isFormValid,
                    // Rezerwacje
                    reservations, sessionReservations, SaveReservation, isHourBooked, bookedHours,
                    // Sprawdzanie i anulowanie rezerwacji
                    checkDate, foundReservation, checkAvailability, cancelReservation, fetchBookedHours,
                    // Responsywność
                    itemsPerPage, itemsPerPageHours, selectedDate, selectedHour, 
                    // Logowanie i rejestracja
                    showLogin, showRegister, loginEmail,
                    loginPassword,
                    loginError,
                    registerName,
                    registerSurname,
                    registerEmail,
                    registerPassword,
                    registerPasswordRepeat,
                    registerError,
                    isRegisterEmailValid,
                    login,
                    register,
                    };
                
            }

            }).mount('#main');