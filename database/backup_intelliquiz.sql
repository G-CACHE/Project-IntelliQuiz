--
-- PostgreSQL database dump
--


-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP INDEX IF EXISTS public.idx_vr_team_id;
DROP INDEX IF EXISTS public.idx_vr_quiz_team;
DROP INDEX IF EXISTS public.idx_vr_quiz_id;
DROP INDEX IF EXISTS public.idx_scoreboard_team_id;
DROP INDEX IF EXISTS public.idx_scoreboard_quiz_id;
DROP INDEX IF EXISTS public.idx_rt_user_id;
DROP INDEX IF EXISTS public.idx_rt_expires_at;
DROP INDEX IF EXISTS public.idx_qbi_type;
DROP INDEX IF EXISTS public.idx_qbi_owner;
DROP INDEX IF EXISTS public.idx_qbi_difficulty;
ALTER TABLE IF EXISTS ONLY public.violation_record DROP CONSTRAINT IF EXISTS violation_record_pkey;
ALTER TABLE IF EXISTS ONLY public."user" DROP CONSTRAINT IF EXISTS user_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_assignment DROP CONSTRAINT IF EXISTS ukpvjve2c5x9nnix57smx4yceg6;
ALTER TABLE IF EXISTS ONLY public.quiz DROP CONSTRAINT IF EXISTS uk_quiz_quiz_code;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS uk_o2mlirhldriil2y7krapq4frt;
ALTER TABLE IF EXISTS ONLY public.team DROP CONSTRAINT IF EXISTS team_pkey;
ALTER TABLE IF EXISTS ONLY public.submission DROP CONSTRAINT IF EXISTS submission_pkey;
ALTER TABLE IF EXISTS ONLY public.scoreboard_entries DROP CONSTRAINT IF EXISTS scoreboard_entries_pkey;
ALTER TABLE IF EXISTS ONLY public.refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz DROP CONSTRAINT IF EXISTS quiz_pkey;
ALTER TABLE IF EXISTS ONLY public.quiz_assignment DROP CONSTRAINT IF EXISTS quiz_assignment_pkey;
ALTER TABLE IF EXISTS ONLY public.question DROP CONSTRAINT IF EXISTS question_pkey;
ALTER TABLE IF EXISTS ONLY public.question_option DROP CONSTRAINT IF EXISTS question_option_pkey;
ALTER TABLE IF EXISTS ONLY public.question_bank_option DROP CONSTRAINT IF EXISTS question_bank_option_pkey;
ALTER TABLE IF EXISTS ONLY public.question_bank_item DROP CONSTRAINT IF EXISTS question_bank_item_pkey;
ALTER TABLE IF EXISTS ONLY public.backup_record DROP CONSTRAINT IF EXISTS backup_record_pkey;
ALTER TABLE IF EXISTS ONLY public.assignment_permission DROP CONSTRAINT IF EXISTS assignment_permission_pkey;
ALTER TABLE IF EXISTS public.violation_record ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."user" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.team ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.submission ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.scoreboard_entries ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.refresh_tokens ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quiz_assignment ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.quiz ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.question_bank_item ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.question ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.backup_record ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.violation_record_id_seq;
DROP TABLE IF EXISTS public.violation_record;
DROP SEQUENCE IF EXISTS public.user_id_seq;
DROP TABLE IF EXISTS public."user";
DROP SEQUENCE IF EXISTS public.team_id_seq;
DROP TABLE IF EXISTS public.team;
DROP SEQUENCE IF EXISTS public.submission_id_seq;
DROP TABLE IF EXISTS public.submission;
DROP SEQUENCE IF EXISTS public.scoreboard_entries_id_seq;
DROP TABLE IF EXISTS public.scoreboard_entries;
DROP SEQUENCE IF EXISTS public.refresh_tokens_id_seq;
DROP TABLE IF EXISTS public.refresh_tokens;
DROP SEQUENCE IF EXISTS public.quiz_id_seq;
DROP SEQUENCE IF EXISTS public.quiz_assignment_id_seq;
DROP TABLE IF EXISTS public.quiz_assignment;
DROP TABLE IF EXISTS public.quiz;
DROP TABLE IF EXISTS public.question_option;
DROP SEQUENCE IF EXISTS public.question_id_seq;
DROP TABLE IF EXISTS public.question_bank_option;
DROP SEQUENCE IF EXISTS public.question_bank_item_id_seq;
DROP TABLE IF EXISTS public.question_bank_item;
DROP TABLE IF EXISTS public.question;
DROP SEQUENCE IF EXISTS public.backup_record_id_seq;
DROP TABLE IF EXISTS public.backup_record;
DROP TABLE IF EXISTS public.assignment_permission;
--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_permission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_permission (
    assignment_id bigint NOT NULL,
    permission character varying(255) NOT NULL,
    CONSTRAINT assignment_permission_permission_check CHECK (((permission)::text = ANY (ARRAY[('CAN_VIEW_DETAILS'::character varying)::text, ('CAN_EDIT_CONTENT'::character varying)::text, ('CAN_MANAGE_TEAMS'::character varying)::text, ('CAN_HOST_GAME'::character varying)::text])))
);


--
-- Name: backup_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_record (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    error_message character varying(2000),
    file_size_bytes bigint NOT NULL,
    filename character varying(255) NOT NULL,
    last_restored_at timestamp(6) without time zone,
    status character varying(255) NOT NULL,
    created_by_user_id bigint,
    deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT backup_record_status_check CHECK (((status)::text = ANY (ARRAY[('IN_PROGRESS'::character varying)::text, ('SUCCESS'::character varying)::text, ('FAILED'::character varying)::text])))
);


--
-- Name: backup_record_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.backup_record_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: backup_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.backup_record_id_seq OWNED BY public.backup_record.id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question (
    id bigint NOT NULL,
    correct_key character varying(255) NOT NULL,
    difficulty character varying(255),
    order_index integer,
    points integer NOT NULL,
    text text NOT NULL,
    time_limit integer,
    type character varying(255),
    quiz_id bigint NOT NULL,
    case_sensitive boolean DEFAULT false NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT question_difficulty_check CHECK (((difficulty)::text = ANY (ARRAY[('EASY'::character varying)::text, ('MEDIUM'::character varying)::text, ('HARD'::character varying)::text, ('TIE_BREAKER'::character varying)::text]))),
    CONSTRAINT question_type_check CHECK (((type)::text = ANY (ARRAY[('MULTIPLE_CHOICE'::character varying)::text, ('TRUE_FALSE'::character varying)::text, ('IDENTIFICATION'::character varying)::text])))
);


--
-- Name: question_bank_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_bank_item (
    id bigint NOT NULL,
    correct_key character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    difficulty character varying(255),
    owner_user_id bigint NOT NULL,
    points integer NOT NULL,
    source_question_id bigint,
    source_quiz_id bigint,
    text text NOT NULL,
    time_limit integer,
    question_type character varying(255) NOT NULL,
    category character varying(255),
    is_harvested boolean NOT NULL,
    source_quiz_title character varying(255),
    CONSTRAINT question_bank_item_difficulty_check CHECK (((difficulty)::text = ANY (ARRAY[('EASY'::character varying)::text, ('MEDIUM'::character varying)::text, ('HARD'::character varying)::text, ('TIE_BREAKER'::character varying)::text]))),
    CONSTRAINT question_bank_item_question_type_check CHECK (((question_type)::text = ANY (ARRAY[('MULTIPLE_CHOICE'::character varying)::text, ('TRUE_FALSE'::character varying)::text, ('IDENTIFICATION'::character varying)::text])))
);


--
-- Name: question_bank_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_bank_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_bank_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_bank_item_id_seq OWNED BY public.question_bank_item.id;


--
-- Name: question_bank_option; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_bank_option (
    question_bank_item_id bigint NOT NULL,
    option_text character varying(255) NOT NULL
);


--
-- Name: question_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.question_id_seq OWNED BY public.question.id;


--
-- Name: question_option; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.question_option (
    question_id bigint NOT NULL,
    option_text character varying(255) NOT NULL
);


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz (
    id bigint NOT NULL,
    description character varying(255),
    is_live_session boolean NOT NULL,
    proctor_pin character varying(255) NOT NULL,
    quiz_code character varying(6),
    status character varying(255),
    title character varying(255) NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    created_by_user_id bigint,
    access_mode character varying(255) DEFAULT 'RESTRICTED'::character varying NOT NULL,
    navigation_mode character varying(255) DEFAULT 'TOURNAMENT'::character varying NOT NULL,
    global_time_limit_seconds integer DEFAULT 0 NOT NULL,
    randomize_questions boolean DEFAULT false NOT NULL,
    CONSTRAINT quiz_status_check CHECK (((status)::text = ANY (ARRAY[('DRAFT'::character varying)::text, ('READY'::character varying)::text, ('ACTIVE'::character varying)::text, ('ARCHIVED'::character varying)::text])))
);


--
-- Name: quiz_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_assignment (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    user_id bigint NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_assignment_id_seq OWNED BY public.quiz_assignment.id;


--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id bigint NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    revoked boolean NOT NULL,
    role character varying(255) NOT NULL,
    token_hash character varying(255) NOT NULL,
    user_id bigint NOT NULL,
    username character varying(255) NOT NULL
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: scoreboard_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scoreboard_entries (
    id bigint NOT NULL,
    is_tied boolean NOT NULL,
    quiz_id bigint NOT NULL,
    rank integer NOT NULL,
    score integer NOT NULL,
    team_id bigint NOT NULL,
    team_name character varying(255) NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: scoreboard_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.scoreboard_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: scoreboard_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.scoreboard_entries_id_seq OWNED BY public.scoreboard_entries.id;


--
-- Name: submission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submission (
    id bigint NOT NULL,
    awarded_points integer,
    is_correct boolean,
    is_graded boolean,
    submitted_answer character varying(255),
    submitted_at timestamp(6) without time zone NOT NULL,
    question_id bigint NOT NULL,
    team_id bigint NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);


--
-- Name: submission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.submission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.submission_id_seq OWNED BY public.submission.id;


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    id bigint NOT NULL,
    access_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_score integer,
    quiz_id bigint NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    device_id character varying(255),
    members text
);


--
-- Name: team_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.team_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.team_id_seq OWNED BY public.team.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."user" (
    id bigint NOT NULL,
    password character varying(255) NOT NULL,
    system_role character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT user_system_role_check CHECK (((system_role)::text = ANY (ARRAY['SUPER_ADMIN'::text, 'ADMIN'::text])))
);


--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: violation_record; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.violation_record (
    id bigint NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    detected_at timestamp(6) without time zone NOT NULL,
    quiz_id bigint NOT NULL,
    team_id bigint NOT NULL,
    violation_type character varying(255) NOT NULL,
    CONSTRAINT violation_record_violation_type_check CHECK (((violation_type)::text = ANY (ARRAY[('TAB_SWITCH'::character varying)::text, ('COPY_ATTEMPT'::character varying)::text, ('RIGHT_CLICK'::character varying)::text, ('PRINT_SCREEN'::character varying)::text])))
);


--
-- Name: violation_record_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.violation_record_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: violation_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.violation_record_id_seq OWNED BY public.violation_record.id;


--
-- Name: backup_record id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_record ALTER COLUMN id SET DEFAULT nextval('public.backup_record_id_seq'::regclass);


--
-- Name: question id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question ALTER COLUMN id SET DEFAULT nextval('public.question_id_seq'::regclass);


--
-- Name: question_bank_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_item ALTER COLUMN id SET DEFAULT nextval('public.question_bank_item_id_seq'::regclass);


--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: quiz_assignment id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_assignment ALTER COLUMN id SET DEFAULT nextval('public.quiz_assignment_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: scoreboard_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scoreboard_entries ALTER COLUMN id SET DEFAULT nextval('public.scoreboard_entries_id_seq'::regclass);


--
-- Name: submission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission ALTER COLUMN id SET DEFAULT nextval('public.submission_id_seq'::regclass);


--
-- Name: team id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team ALTER COLUMN id SET DEFAULT nextval('public.team_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Name: violation_record id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.violation_record ALTER COLUMN id SET DEFAULT nextval('public.violation_record_id_seq'::regclass);


--
-- Data for Name: assignment_permission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.assignment_permission (assignment_id, permission) FROM stdin;
2	CAN_HOST_GAME
2	CAN_VIEW_DETAILS
2	CAN_EDIT_CONTENT
2	CAN_MANAGE_TEAMS
1	CAN_VIEW_DETAILS
1	CAN_HOST_GAME
1	CAN_EDIT_CONTENT
1	CAN_MANAGE_TEAMS
3	CAN_VIEW_DETAILS
3	CAN_HOST_GAME
3	CAN_EDIT_CONTENT
3	CAN_MANAGE_TEAMS
\.


--
-- Data for Name: backup_record; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backup_record (id, created_at, error_message, file_size_bytes, filename, last_restored_at, status, created_by_user_id, deleted) FROM stdin;
6	2026-03-01 04:22:39.980985	\N	23248	intelliquiz_backup_2026-03-01T04-22-39.sql	2026-03-01 04:26:12.80951	SUCCESS	1	t
7	2026-03-01 04:26:12.823287	\N	23629	intelliquiz_backup_2026-03-01T04-26-12.sql	\N	SUCCESS	1	t
1	2026-05-29 05:34:11.164454	\N	27609	intelliquiz_backup_2026-05-29T05-34-11.sql	\N	SUCCESS	1	f
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question (id, correct_key, difficulty, order_index, points, text, time_limit, type, quiz_id, case_sensitive, deleted) FROM stdin;
1	A	EASY	0	20	1+1	1000	MULTIPLE_CHOICE	1	f	f
2	B	EASY	0	1	1+1	30	MULTIPLE_CHOICE	3	f	f
3	B	EASY	1	10	2+2	30	MULTIPLE_CHOICE	3	f	f
\.


--
-- Data for Name: question_bank_item; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_bank_item (id, correct_key, created_at, difficulty, owner_user_id, points, source_question_id, source_quiz_id, text, time_limit, question_type, category, is_harvested, source_quiz_title) FROM stdin;
\.


--
-- Data for Name: question_bank_option; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_bank_option (question_bank_item_id, option_text) FROM stdin;
\.


--
-- Data for Name: question_option; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.question_option (question_id, option_text) FROM stdin;
1	2
1	11
1	13
1	22
2	1
2	2
2	3
2	4
3	2
3	4
3	6
3	8
\.


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz (id, description, is_live_session, proctor_pin, quiz_code, status, title, deleted, created_by_user_id, access_mode, navigation_mode, global_time_limit_seconds, randomize_questions) FROM stdin;
1		f	635-058	SCEEKB	DRAFT	testing	f	2	PUBLIC	TOURNAMENT	0	f
\.


--
-- Data for Name: quiz_assignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_assignment (id, quiz_id, user_id, deleted) FROM stdin;
1	1	2	f
2	2	2	f
3	2	3	f
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, created_at, expires_at, revoked, role, token_hash, user_id, username) FROM stdin;
1	2026-05-29 05:33:47.021418+08	2026-06-05 05:33:47.021397+08	f	SUPER_ADMIN	fe28545b27840d4975a9c9dff9b5f58f9d8f9d4891c914996638141ddc1c5af5	1	superadmin
2	2026-05-29 05:34:50.656481+08	2026-06-05 05:34:50.656472+08	f	ADMIN	809677af4758fd5bf59ad776e578350159b9dbe3e4ad67cfd03448bd1e139824	2	adminIT
4	2026-05-29 07:47:25.952046+08	2026-06-05 07:47:25.95204+08	f	ADMIN	d9e040ee136948670ff8062111becf9668df010954a6170ff70a285de3d8a656	2	adminIT
3	2026-05-29 05:45:41.828182+08	2026-06-05 05:45:41.828174+08	t	ADMIN	8c788bd7b526bd112257cd88451f68bffce8853507281279f743190483f6eb21	2	adminIT
\.


--
-- Data for Name: scoreboard_entries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.scoreboard_entries (id, is_tied, quiz_id, rank, score, team_id, team_name, deleted) FROM stdin;
1	f	3	1	0	1	Errawrs	f
\.


--
-- Data for Name: submission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.submission (id, awarded_points, is_correct, is_graded, submitted_answer, submitted_at, question_id, team_id, deleted) FROM stdin;
\.


--
-- Data for Name: team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team (id, access_code, name, total_score, quiz_id, deleted, device_id, members) FROM stdin;
1	TZV-7TV	Errawrs	0	3	f	\N	\N
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."user" (id, password, system_role, username, deleted) FROM stdin;
1	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	SUPER_ADMIN	superadmin	f
2	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	ADMIN	adminIT	f
3	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	ADMIN	adminv2	f
\.


--
-- Data for Name: violation_record; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.violation_record (id, deleted, detected_at, quiz_id, team_id, violation_type) FROM stdin;
\.


--
-- Name: backup_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.backup_record_id_seq', 7, true);


--
-- Name: question_bank_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.question_bank_item_id_seq', 1, true);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.question_id_seq', 3, true);


--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_assignment_id_seq', 3, true);


--
-- Name: quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_id_seq', 1, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 4, true);


--
-- Name: scoreboard_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.scoreboard_entries_id_seq', 1, true);


--
-- Name: submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.submission_id_seq', 1, true);


--
-- Name: team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.team_id_seq', 1, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_id_seq', 3, true);


--
-- Name: violation_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.violation_record_id_seq', 1, false);


--
-- Name: assignment_permission assignment_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_permission
    ADD CONSTRAINT assignment_permission_pkey PRIMARY KEY (assignment_id, permission);


--
-- Name: backup_record backup_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_record
    ADD CONSTRAINT backup_record_pkey PRIMARY KEY (id);


--
-- Name: question_bank_item question_bank_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_item
    ADD CONSTRAINT question_bank_item_pkey PRIMARY KEY (id);


--
-- Name: question_bank_option question_bank_option_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_bank_option
    ADD CONSTRAINT question_bank_option_pkey PRIMARY KEY (question_bank_item_id, option_text);


--
-- Name: question_option question_option_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question_option
    ADD CONSTRAINT question_option_pkey PRIMARY KEY (question_id, option_text);


--
-- Name: question question_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: quiz_assignment quiz_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_assignment
    ADD CONSTRAINT quiz_assignment_pkey PRIMARY KEY (id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: scoreboard_entries scoreboard_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scoreboard_entries
    ADD CONSTRAINT scoreboard_entries_pkey PRIMARY KEY (id);


--
-- Name: submission submission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_pkey PRIMARY KEY (id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens uk_o2mlirhldriil2y7krapq4frt; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT uk_o2mlirhldriil2y7krapq4frt UNIQUE (token_hash);


--
-- Name: quiz uk_quiz_quiz_code; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT uk_quiz_quiz_code UNIQUE (quiz_code);


--
-- Name: quiz_assignment ukpvjve2c5x9nnix57smx4yceg6; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_assignment
    ADD CONSTRAINT ukpvjve2c5x9nnix57smx4yceg6 UNIQUE (user_id, quiz_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: violation_record violation_record_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.violation_record
    ADD CONSTRAINT violation_record_pkey PRIMARY KEY (id);


--
-- Name: idx_qbi_difficulty; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qbi_difficulty ON public.question_bank_item USING btree (difficulty);


--
-- Name: idx_qbi_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qbi_owner ON public.question_bank_item USING btree (owner_user_id);


--
-- Name: idx_qbi_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_qbi_type ON public.question_bank_item USING btree (question_type);


--
-- Name: idx_rt_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rt_expires_at ON public.refresh_tokens USING btree (expires_at);


--
-- Name: idx_rt_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rt_user_id ON public.refresh_tokens USING btree (user_id);


--
-- Name: idx_scoreboard_quiz_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scoreboard_quiz_id ON public.scoreboard_entries USING btree (quiz_id);


--
-- Name: idx_scoreboard_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_scoreboard_team_id ON public.scoreboard_entries USING btree (team_id);


--
-- Name: idx_vr_quiz_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vr_quiz_id ON public.violation_record USING btree (quiz_id);


--
-- Name: idx_vr_quiz_team; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vr_quiz_team ON public.violation_record USING btree (quiz_id, team_id);


--
-- Name: idx_vr_team_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vr_team_id ON public.violation_record USING btree (team_id);


--
-- PostgreSQL database dump complete
--


