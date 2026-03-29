--
-- PostgreSQL database dump
--

\restrict JjbdApKfXCDzG2xib6cVUeivf2hxgAumFnEu6KHRfu28nMeIErx2uqLdeq8KNm4

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_permission (
    assignment_id bigint NOT NULL,
    permission character varying(255),
    CONSTRAINT assignment_permission_permission_check CHECK (((permission)::text = ANY (ARRAY[('CAN_VIEW_DETAILS'::character varying)::text, ('CAN_EDIT_CONTENT'::character varying)::text, ('CAN_MANAGE_TEAMS'::character varying)::text, ('CAN_HOST_GAME'::character varying)::text])))
);


ALTER TABLE public.assignment_permission OWNER TO postgres;

--
-- Name: backup_record; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.backup_record OWNER TO postgres;

--
-- Name: backup_record_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.backup_record_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.backup_record_id_seq OWNER TO postgres;

--
-- Name: backup_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.backup_record_id_seq OWNED BY public.backup_record.id;


--
-- Name: question; Type: TABLE; Schema: public; Owner: postgres
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
    deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT question_difficulty_check CHECK (((difficulty)::text = ANY (ARRAY[('EASY'::character varying)::text, ('MEDIUM'::character varying)::text, ('HARD'::character varying)::text, ('TIE_BREAKER'::character varying)::text]))),
    CONSTRAINT question_type_check CHECK (((type)::text = ANY (ARRAY[('MULTIPLE_CHOICE'::character varying)::text, ('IDENTIFICATION'::character varying)::text])))
);


ALTER TABLE public.question OWNER TO postgres;

--
-- Name: question_bank_item; Type: TABLE; Schema: public; Owner: postgres
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
    CONSTRAINT question_bank_item_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['EASY'::character varying, 'MEDIUM'::character varying, 'HARD'::character varying, 'TIE_BREAKER'::character varying])::text[]))),
    CONSTRAINT question_bank_item_question_type_check CHECK (((question_type)::text = ANY ((ARRAY['MULTIPLE_CHOICE'::character varying, 'IDENTIFICATION'::character varying])::text[])))
);


ALTER TABLE public.question_bank_item OWNER TO postgres;

--
-- Name: question_bank_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_bank_item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_bank_item_id_seq OWNER TO postgres;

--
-- Name: question_bank_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_bank_item_id_seq OWNED BY public.question_bank_item.id;


--
-- Name: question_bank_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_bank_option (
    question_bank_item_id bigint NOT NULL,
    option_text character varying(255)
);


ALTER TABLE public.question_bank_option OWNER TO postgres;

--
-- Name: question_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.question_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.question_id_seq OWNER TO postgres;

--
-- Name: question_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.question_id_seq OWNED BY public.question.id;


--
-- Name: question_option; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.question_option (
    question_id bigint NOT NULL,
    option_text character varying(255)
);


ALTER TABLE public.question_option OWNER TO postgres;

--
-- Name: quiz; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.quiz OWNER TO postgres;

--
-- Name: quiz_assignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_assignment (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    user_id bigint NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.quiz_assignment OWNER TO postgres;

--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_assignment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_assignment_id_seq OWNER TO postgres;

--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_assignment_id_seq OWNED BY public.quiz_assignment.id;


--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.quiz_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.quiz_id_seq OWNER TO postgres;

--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;


--
-- Name: scoreboard_entries; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.scoreboard_entries OWNER TO postgres;

--
-- Name: scoreboard_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.scoreboard_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.scoreboard_entries_id_seq OWNER TO postgres;

--
-- Name: scoreboard_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.scoreboard_entries_id_seq OWNED BY public.scoreboard_entries.id;


--
-- Name: submission; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.submission OWNER TO postgres;

--
-- Name: submission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.submission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.submission_id_seq OWNER TO postgres;

--
-- Name: submission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.submission_id_seq OWNED BY public.submission.id;


--
-- Name: team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team (
    id bigint NOT NULL,
    access_code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_score integer,
    quiz_id bigint NOT NULL,
    deleted boolean DEFAULT false NOT NULL
);


ALTER TABLE public.team OWNER TO postgres;

--
-- Name: team_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_id_seq OWNER TO postgres;

--
-- Name: team_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_id_seq OWNED BY public.team.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id bigint NOT NULL,
    password character varying(255) NOT NULL,
    system_role character varying(255) NOT NULL,
    username character varying(255) NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    CONSTRAINT user_system_role_check CHECK (((system_role)::text = ANY (ARRAY[('SUPER_ADMIN'::character varying)::text, ('ADMIN'::character varying)::text])))
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: backup_record id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_record ALTER COLUMN id SET DEFAULT nextval('public.backup_record_id_seq'::regclass);


--
-- Name: question id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question ALTER COLUMN id SET DEFAULT nextval('public.question_id_seq'::regclass);


--
-- Name: question_bank_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank_item ALTER COLUMN id SET DEFAULT nextval('public.question_bank_item_id_seq'::regclass);


--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: quiz_assignment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_assignment ALTER COLUMN id SET DEFAULT nextval('public.quiz_assignment_id_seq'::regclass);


--
-- Name: scoreboard_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoreboard_entries ALTER COLUMN id SET DEFAULT nextval('public.scoreboard_entries_id_seq'::regclass);


--
-- Name: submission id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission ALTER COLUMN id SET DEFAULT nextval('public.submission_id_seq'::regclass);


--
-- Name: team id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team ALTER COLUMN id SET DEFAULT nextval('public.team_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: assignment_permission; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: backup_record; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_record (id, created_at, error_message, file_size_bytes, filename, last_restored_at, status, created_by_user_id, deleted) FROM stdin;
6	2026-03-01 04:22:39.980985	\N	23248	intelliquiz_backup_2026-03-01T04-22-39.sql	2026-03-01 04:26:12.80951	SUCCESS	1	t
7	2026-03-01 04:26:12.823287	\N	23629	intelliquiz_backup_2026-03-01T04-26-12.sql	\N	SUCCESS	1	t
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question (id, correct_key, difficulty, order_index, points, text, time_limit, type, quiz_id, deleted) FROM stdin;
1	A	EASY	0	20	1+1	1000	MULTIPLE_CHOICE	1	f
2	B	EASY	0	1	1+1	30	MULTIPLE_CHOICE	3	f
3	B	EASY	1	10	2+2	30	MULTIPLE_CHOICE	3	f
\.


--
-- Data for Name: question_bank_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_bank_item (id, correct_key, created_at, difficulty, owner_user_id, points, source_question_id, source_quiz_id, text, time_limit, question_type) FROM stdin;
\.


--
-- Data for Name: question_bank_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_bank_option (question_bank_item_id, option_text) FROM stdin;
\.


--
-- Data for Name: question_option; Type: TABLE DATA; Schema: public; Owner: postgres
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
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz (id, description, is_live_session, proctor_pin, status, title, deleted, created_by_user_id) FROM stdin;
1		f	101-513	DRAFT	Science Quiz Bee	f	\N
2		f	601-436	DRAFT	Math	f	\N
3		t	888-702	READY	Earth Science	f	\N
\.


--
-- Data for Name: quiz_assignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_assignment (id, quiz_id, user_id, deleted) FROM stdin;
1	1	2	f
2	2	2	f
3	2	3	f
\.


--
-- Data for Name: scoreboard_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scoreboard_entries (id, is_tied, quiz_id, rank, score, team_id, team_name, deleted) FROM stdin;
1	f	3	1	0	1	Errawrs	f
\.


--
-- Data for Name: submission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submission (id, awarded_points, is_correct, is_graded, submitted_answer, submitted_at, question_id, team_id, deleted) FROM stdin;
\.


--
-- Data for Name: team; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team (id, access_code, name, total_score, quiz_id, deleted) FROM stdin;
1	TZV-7TV	Errawrs	0	3	f
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, password, system_role, username, deleted) FROM stdin;
1	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	SUPER_ADMIN	superadmin	f
2	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	ADMIN	adminIT	f
3	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	ADMIN	adminv2	f
\.


--
-- Name: backup_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.backup_record_id_seq', 8, true);


--
-- Name: question_bank_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_bank_item_id_seq', 1, false);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_id_seq', 3, true);


--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_assignment_id_seq', 3, true);


--
-- Name: quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_id_seq', 3, true);


--
-- Name: scoreboard_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scoreboard_entries_id_seq', 1, true);


--
-- Name: submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submission_id_seq', 1, false);


--
-- Name: team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_id_seq', 1, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 3, true);


--
-- Name: backup_record backup_record_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_record
    ADD CONSTRAINT backup_record_pkey PRIMARY KEY (id);


--
-- Name: question_bank_item question_bank_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank_item
    ADD CONSTRAINT question_bank_item_pkey PRIMARY KEY (id);


--
-- Name: question question_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT question_pkey PRIMARY KEY (id);


--
-- Name: quiz_assignment quiz_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_assignment
    ADD CONSTRAINT quiz_assignment_pkey PRIMARY KEY (id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: scoreboard_entries scoreboard_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoreboard_entries
    ADD CONSTRAINT scoreboard_entries_pkey PRIMARY KEY (id);


--
-- Name: submission submission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT submission_pkey PRIMARY KEY (id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id);


--
-- Name: scoreboard_entries uk_209tg1o0uit4frd88bpcmay1o; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scoreboard_entries
    ADD CONSTRAINT uk_209tg1o0uit4frd88bpcmay1o UNIQUE (team_id);


--
-- Name: quiz uk_quiz_quiz_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT uk_quiz_quiz_code UNIQUE (quiz_code);


--
-- Name: user uk_sb8bbouer5wak8vyiiy4pf2bx; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT uk_sb8bbouer5wak8vyiiy4pf2bx UNIQUE (username);


--
-- Name: backup_record uk_seu5k8o0adwisaothfectynqk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_record
    ADD CONSTRAINT uk_seu5k8o0adwisaothfectynqk UNIQUE (filename);


--
-- Name: quiz_assignment ukpvjve2c5x9nnix57smx4yceg6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_assignment
    ADD CONSTRAINT ukpvjve2c5x9nnix57smx4yceg6 UNIQUE (user_id, quiz_id);


--
-- Name: user user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);


--
-- Name: idx_qbi_difficulty; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qbi_difficulty ON public.question_bank_item USING btree (difficulty);


--
-- Name: idx_qbi_owner; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qbi_owner ON public.question_bank_item USING btree (owner_user_id);


--
-- Name: idx_qbi_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_qbi_type ON public.question_bank_item USING btree (question_type);


--
-- Name: idx_scoreboard_quiz_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scoreboard_quiz_id ON public.scoreboard_entries USING btree (quiz_id);


--
-- Name: idx_scoreboard_team_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_scoreboard_team_id ON public.scoreboard_entries USING btree (team_id);


--
-- Name: backup_record fk5vi0ttd1g38h8yk1xdtfv1g6i; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_record
    ADD CONSTRAINT fk5vi0ttd1g38h8yk1xdtfv1g6i FOREIGN KEY (created_by_user_id) REFERENCES public."user"(id);


--
-- Name: assignment_permission fk6ef1m1cs1ioqdwlexuxb1880e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assignment_permission
    ADD CONSTRAINT fk6ef1m1cs1ioqdwlexuxb1880e FOREIGN KEY (assignment_id) REFERENCES public.quiz_assignment(id);


--
-- Name: quiz_assignment fkammnyuufr9j6osu3agec84cvx; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_assignment
    ADD CONSTRAINT fkammnyuufr9j6osu3agec84cvx FOREIGN KEY (quiz_id) REFERENCES public.quiz(id);


--
-- Name: question fkb0yh0c1qaxfwlcnwo9dms2txf; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question
    ADD CONSTRAINT fkb0yh0c1qaxfwlcnwo9dms2txf FOREIGN KEY (quiz_id) REFERENCES public.quiz(id);


--
-- Name: team fkg5ffl41mlfyt7lasn0h4715m8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT fkg5ffl41mlfyt7lasn0h4715m8 FOREIGN KEY (quiz_id) REFERENCES public.quiz(id);


--
-- Name: question_bank_option fkgnjl452ii5hhkspm85hmu7fwl; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_bank_option
    ADD CONSTRAINT fkgnjl452ii5hhkspm85hmu7fwl FOREIGN KEY (question_bank_item_id) REFERENCES public.question_bank_item(id);


--
-- Name: submission fkjskf22duewv7lid6te7nnixdq; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT fkjskf22duewv7lid6te7nnixdq FOREIGN KEY (question_id) REFERENCES public.question(id);


--
-- Name: submission fkmgn97o68jw1xnlhje4luw2xmp; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission
    ADD CONSTRAINT fkmgn97o68jw1xnlhje4luw2xmp FOREIGN KEY (team_id) REFERENCES public.team(id);


--
-- Name: question_option fkmmdv54rmm5hkgxbn1008ix87n; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.question_option
    ADD CONSTRAINT fkmmdv54rmm5hkgxbn1008ix87n FOREIGN KEY (question_id) REFERENCES public.question(id);


--
-- Name: quiz_assignment fkq15xgwiqmg5qo6wypkrrkcc5k; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_assignment
    ADD CONSTRAINT fkq15xgwiqmg5qo6wypkrrkcc5k FOREIGN KEY (user_id) REFERENCES public."user"(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict JjbdApKfXCDzG2xib6cVUeivf2hxgAumFnEu6KHRfu28nMeIErx2uqLdeq8KNm4

