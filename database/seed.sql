USE catering_management;

INSERT IGNORE INTO packages (name, description, price_per_guest, minimum_guests)
VALUES
    ('Classic Celebration', 'A welcoming buffet with crowd-favorite dishes, rice, drinks, and dessert.', 450.00, 30),
    ('Golden Occasion', 'A premium banquet selection for birthdays, reunions, and milestones.', 650.00, 40),
    ('Grand Feast', 'An elevated event menu with a wider selection of mains, sides, and sweets.', 850.00, 50);
