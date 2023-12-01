create database messenger;

CREATE TABLE users
(
    id        SERIAL PRIMARY KEY,
    user_name VARCHAR(50)  NOT NULL,
    login     VARCHAR(50)  NOT NULL,
    password  VARCHAR(100) NOT NULL,
    FCMtoken VARCHAR(255) NOT NULL
);

ALTER TABLE users ADD avatar TEXT;

CREATE TABLE chats
(
    id        SERIAL PRIMARY KEY,
    user_id_1 INTEGER NOT NULL,
    user_id_2 INTEGER NOT NULL,
    FOREIGN KEY (user_id_1) REFERENCES users (id),
    FOREIGN KEY (user_id_2) REFERENCES users (id)
);

CREATE TABLE messages
(
    id           SERIAL PRIMARY KEY,
    chat_id      INTEGER   NOT NULL,
    sender_id    INTEGER   NOT NULL,
    recipient_id INTEGER   NOT NULL,
    content      TEXT      NOT NULL,
    time_stamp   TIMESTAMP NOT NULL,
    is_readed BOOLEAN NOT NULL,
    is_edited BOOLEAN NOT NULL,
    file VARCHAR(255),
    file_type VARCHAR(255),
    originalfile VARCHAR(255),
    FOREIGN KEY (chat_id) REFERENCES chats (id),
    FOREIGN KEY (sender_id) REFERENCES users (id),
    FOREIGN KEY (recipient_id) REFERENCES users (id)
);


CREATE TABLE ARCHIVEchats
(
    id        SERIAL PRIMARY KEY,
    user_id_1 INTEGER NOT NULL,
    user_id_2 INTEGER NOT NULL
);

CREATE TABLE ARCHIVEmessages
(
    id           SERIAL PRIMARY KEY,
    chat_id      INTEGER   NOT NULL,
    sender_id    INTEGER   NOT NULL,
    recipient_id INTEGER   NOT NULL,
    content      TEXT      NOT NULL,
    time_stamp   TIMESTAMP NOT NULL,
    is_readed BOOLEAN NOT NULL,
    is_edited BOOLEAN NOT NULL,
    file VARCHAR(255),
    file_type VARCHAR(255),
    originalfile VARCHAR(255)
);





