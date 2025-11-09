-- Seed data for SavePoint Inventory

-- Suppliers
INSERT INTO suppliers (name, contact_email, contact_phone) VALUES
    ('Sony Interactive Entertainment', 'partners@sie.example', '555-0101'),
    ('Nintendo Distribution',          'sales@nintendo.example', '555-0102'),
    ('IndieGame Collective',           'hello@indiecollective.example', '555-0103'),
    ('PC Masters Wholesale',           'support@pcmasters.example', '555-0104'),
    ('Retro Classics Ltd.',            'contact@retroclassics.example', '555-0105');

-- Products (a mix of platforms, editions, and suppliers)
INSERT INTO products (name, platform, edition, genre, base_price, is_physical, is_digital, supplier_id) VALUES
    ('Spider-Man 2',         'PS5',    'Standard', 'Action',     69.99, TRUE,  FALSE, 1),
    ('Spider-Man 2',         'PS5',    'Digital',  'Action',     69.99, FALSE, TRUE,  1),
    ('The Last of Us Part I','PS5',    'Standard', 'Adventure',  59.99, TRUE,  FALSE, 1),
    ('Mario Kart 8 Deluxe',  'Switch', 'Standard', 'Racing',     59.99, TRUE,  FALSE, 2),
    ('Zelda: Tears of the Kingdom','Switch','Standard','Adventure',69.99, TRUE, FALSE, 2),
    ('Cozy Valley',          'Switch', 'Standard', 'Simulation', 39.99, TRUE,  FALSE, 3),
    ('DungeonCrawler 3000',  'PC',     'Standard', 'RPG',        49.99, FALSE, TRUE,  4),
    ('Retro Pack Vol. 1',    'PS5',    'Standard', 'Retro',      29.99, TRUE,  FALSE, 5),
    ('Retro Pack Vol. 1',    'Switch', 'Standard', 'Retro',      29.99, TRUE,  FALSE, 5),
    ('Indie Rhythm Blast',   'PC',    'Standard', 'Music',      19.99, FALSE, TRUE,  3),
    ('Animal Crossing',    'Switch',   'Standard', 'Simulation',  69.99, TRUE,  FALSE, 2);

-- Inventory (one row per product)
INSERT INTO inventory (product_id, quantity_on_hand, reorder_level) VALUES
    (1, 30, 10),
    (2, 999, 0),   -- digital code, effectively unlimited
    (3, 20, 5),
    (4, 25, 8),
    (5, 15, 5),
    (6, 18, 6),
    (7, 999, 0),   -- digital-only PC game
    (8, 12, 4),
    (9, 10, 3),
    (10, 999, 0),
    (11, 98, 0);

-- Customers
INSERT INTO customers (name, email) VALUES
    ('Regina Tam',      'regina.tam@example.com'),
    ('Daaimah Tibrey',  'daaimah.tibrey@example.com'),
    ('Ami Lian',        'ami.lian@example.com'),
    ('Aya Asylbek',    'aya.asylbek@example.com'),
    ('Gaby Campos',  'gaby.campos@example.com'),
    ('Joy Sau',       'joy.sau@example.com'),
    ('Katie Wu',      'katie.wu@example.com'),
    ('Linda Sanchez',      'linda.sanchez@example.com'),
    ('Michelle Glauser',    'michelle.glauser@example.com'),
    ('Nia Wright',  'nia.wright@example.com'),
    ('Rachel Greenwood',  'rachel.greenwood@example.com'),
    ('Alex Lukinicheva',  'alex.lukinicheva@example.com'),
    ('Guest Customer',  'guest@example.com');
