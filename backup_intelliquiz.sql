--
-- PostgreSQL database dump
--

\restrict sYNGGRPQTtGiQ2L3lcATLcoHhOCVZkHoIfPwJyPT9CkfAnVkTzhzftHfZTbxMGy

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assignment_permission (
    assignment_id bigint NOT NULL,
    permission character varying(255),
    CONSTRAINT assignment_permission_permission_check CHECK (((permission)::text = ANY ((ARRAY['CAN_VIEW_DETAILS'::character varying, 'CAN_EDIT_CONTENT'::character varying, 'CAN_MANAGE_TEAMS'::character varying, 'CAN_HOST_GAME'::character varying])::text[])))
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
    CONSTRAINT backup_record_status_check CHECK (((status)::text = ANY ((ARRAY['IN_PROGRESS'::character varying, 'SUCCESS'::character varying, 'FAILED'::character varying])::text[])))
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
    CONSTRAINT question_difficulty_check CHECK (((difficulty)::text = ANY ((ARRAY['EASY'::character varying, 'MEDIUM'::character varying, 'HARD'::character varying, 'TIE_BREAKER'::character varying])::text[]))),
    CONSTRAINT question_type_check CHECK (((type)::text = ANY ((ARRAY['MULTIPLE_CHOICE'::character varying, 'IDENTIFICATION'::character varying])::text[])))
);


ALTER TABLE public.question OWNER TO postgres;

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
    status character varying(255),
    title character varying(255) NOT NULL,
    CONSTRAINT quiz_status_check CHECK (((status)::text = ANY ((ARRAY['DRAFT'::character varying, 'READY'::character varying, 'ARCHIVED'::character varying])::text[])))
);


ALTER TABLE public.quiz OWNER TO postgres;

--
-- Name: quiz_assignment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quiz_assignment (
    id bigint NOT NULL,
    quiz_id bigint NOT NULL,
    user_id bigint NOT NULL
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
    team_id bigint NOT NULL
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
    quiz_id bigint NOT NULL
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
    CONSTRAINT user_system_role_check CHECK (((system_role)::text = ANY ((ARRAY['SUPER_ADMIN'::character varying, 'ADMIN'::character varying])::text[])))
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
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: quiz_assignment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quiz_assignment ALTER COLUMN id SET DEFAULT nextval('public.quiz_assignment_id_seq'::regclass);


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
\.


--
-- Data for Name: backup_record; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.backup_record (id, created_at, error_message, file_size_bytes, filename, last_restored_at, status, created_by_user_id) FROM stdin;
\.


--
-- Data for Name: question; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question (id, correct_key, difficulty, order_index, points, text, time_limit, type, quiz_id) FROM stdin;
\.


--
-- Data for Name: question_option; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.question_option (question_id, option_text) FROM stdin;
\.


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz (id, description, is_live_session, proctor_pin, status, title) FROM stdin;
\.


--
-- Data for Name: quiz_assignment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quiz_assignment (id, quiz_id, user_id) FROM stdin;
\.


--
-- Data for Name: submission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submission (id, awarded_points, is_correct, is_graded, submitted_answer, submitted_at, question_id, team_id) FROM stdin;
\.


--
-- Data for Name: team; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.team (id, access_code, name, total_score, quiz_id) FROM stdin;
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, password, system_role, username) FROM stdin;
\.


--
-- Name: backup_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.backup_record_id_seq', 1, false);


--
-- Name: question_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.question_id_seq', 1, false);


--
-- Name: quiz_assignment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_assignment_id_seq', 1, false);


--
-- Name: quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.quiz_id_seq', 1, false);


--
-- Name: submission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submission_id_seq', 1, false);


--
-- Name: team_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.team_id_seq', 1, false);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 1, false);


--
-- Name: backup_record backup_record_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.backup_record
    ADD CONSTRAINT backup_record_pkey PRIMARY KEY (id);


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
-- PostgreSQL database dump complete
--

\unrestrict sYNGGRPQTtGiQ2L3lcATLcoHhOCVZkHoIfPwJyPT9CkfAnVkTzhzftHfZTbxMGy

